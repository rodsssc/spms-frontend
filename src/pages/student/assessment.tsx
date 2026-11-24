import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../@/components/ui/card";
import RadialProgress from "../../components/radial_progress";
import { getAssessment, submitAssessment, type AssessmentScript } from "../../services/student/assessment.services";

type Screen = "loading" | "ready" | "recording" | "reviewing" | "processing" | "completed" | "failed";

type SpeechRecognitionLike = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; length: number; isFinal: boolean }> }) => void) | null;
    onerror: (() => void) | null;
    start: () => void;
    stop: () => void;
};

function normalizeWord(word: string) {
    return word.toLocaleLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
}

function isLikelyTagalog(text: string) {
    const words = text.split(/\s+/).map(normalizeWord);
    const markers = new Set(["ang", "mga", "ng", "siya", "niya", "niyang", "kanyang", "hindi", "ako", "ikaw", "sila", "kami", "namin", "natin", "kanila", "ito", "iyon", "doon", "dito", "habang"]);
    return words.filter((word) => markers.has(word)).length >= 2;
}

function findReadState(passage: string, segments: Array<{ transcript: string; isFinal: boolean }>) {
    const passageWords = passage.split(/\s+/).map(normalizeWord).filter(Boolean);
    const incorrectWords = new Set<number>();
    let passageIndex = 0;
    let lastMatchedIndex = -1;

    for (const segment of segments) {
        const spokenWords = segment.transcript.split(/\s+/).map(normalizeWord).filter(Boolean);
        for (const spokenWord of spokenWords) {
            const searchEnd = Math.min(passageIndex + 4, passageWords.length);
            let matchedIndex = -1;
            for (let index = passageIndex; index < searchEnd; index += 1) {
                if (passageWords[index] === spokenWord) {
                    matchedIndex = index;
                    break;
                }
            }
            if (matchedIndex >= 0) {
                if (segment.isFinal) {
                    for (let index = passageIndex; index < matchedIndex; index += 1) incorrectWords.add(index);
                }
                lastMatchedIndex = matchedIndex;
                passageIndex = matchedIndex + 1;
            } else if (segment.isFinal && passageIndex < passageWords.length) {
                incorrectWords.add(passageIndex);
                lastMatchedIndex = passageIndex;
                passageIndex += 1;
            }
        }
    }

    return { lastMatchedIndex, incorrectWords: [...incorrectWords] };
}

export default function Assessment() {
    const navigate = useNavigate();
    const { scriptId } = useParams();
    const [assessment, setAssessment] = useState<AssessmentScript | null>(null);
    const [screen, setScreen] = useState<Screen>("loading");
    const [message, setMessage] = useState("");
    const [elapsed, setElapsed] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [lastReadWord, setLastReadWord] = useState(-1);
    const [incorrectWords, setIncorrectWords] = useState<number[]>([]);
    const [liveHighlightAvailable, setLiveHighlightAvailable] = useState(true);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const submittingRef = useRef(false);

    useEffect(() => {
        if (!scriptId) return;
        getAssessment(scriptId).then((data) => {
            setAssessment(data);
            setScreen(data.assessment ? "completed" : "ready");
        }).catch(() => { setMessage("Unable to load this assessment."); setScreen("failed"); });
    }, [scriptId]);

    useEffect(() => {
        if (screen !== "recording") return;
        const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
        return () => window.clearInterval(timer);
    }, [screen]);

    useEffect(() => () => {
        speechRecognitionRef.current?.stop();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        if (audioUrl) URL.revokeObjectURL(audioUrl);
    }, [audioUrl]);

    const startRecording = async () => {
        if (!window.isSecureContext) {
            setMessage("Microphone recording requires a secure (HTTPS or localhost) connection."); setScreen("failed"); return;
        }
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            setMessage("Your browser does not support microphone recording. Please use a current Chrome, Edge, or Firefox browser."); setScreen("failed"); return;
        }
        setMessage(""); setElapsed(0); setAudioUrl(null); setLastReadWord(-1); setIncorrectWords([]); chunksRef.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data);
            recorder.onstop = () => {
                const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
                if (!audio.size) { setMessage("No audio was recorded. Please try again."); setScreen("failed"); return; }
                setAudioUrl(URL.createObjectURL(audio)); setScreen("reviewing");
            };
            streamRef.current = stream; recorderRef.current = recorder; recorder.start(); setScreen("recording");

            const speechWindow = window as typeof window & {
                SpeechRecognition?: new () => SpeechRecognitionLike;
                webkitSpeechRecognition?: new () => SpeechRecognitionLike;
            };
            const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setLiveHighlightAvailable(false);
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = assessment?.content && isLikelyTagalog(assessment.content) ? "fil-PH" : "en-US";
            recognition.onresult = (event) => {
                const segments = Array.from(event.results).map((result) => ({
                    transcript: result[0]?.transcript ?? "",
                    isFinal: result.isFinal,
                }));
                if (assessment?.content) {
                    const state = findReadState(assessment.content, segments);
                    setLastReadWord(state.lastMatchedIndex);
                    setIncorrectWords(state.incorrectWords);
                }
            };
            recognition.onerror = () => setLiveHighlightAvailable(false);
            speechRecognitionRef.current = recognition;
            try {
                recognition.start();
                setLiveHighlightAvailable(true);
            } catch {
                setLiveHighlightAvailable(false);
            }
        } catch (error: unknown) {
            const name = (error as DOMException)?.name;
            setMessage(name === "NotAllowedError" ? "Microphone permission was denied. Allow microphone access and try again." : "The microphone could not be started. Check that it is connected and not in use by another application.");
            setScreen("failed");
        }
    };

    const stopRecording = () => {
        speechRecognitionRef.current?.stop();
        speechRecognitionRef.current = null;
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
        streamRef.current?.getTracks().forEach((track) => track.stop());
    };

    const submit = async () => {
        if (!assessment || !chunksRef.current.length || submittingRef.current) return;
        submittingRef.current = true;
        setScreen("processing"); setMessage("");
        try {
            const audio = new Blob(chunksRef.current, { type: recorderRef.current?.mimeType || "audio/webm" });
            const result = await submitAssessment(assessment.id, audio);
            setAssessment(result); setScreen("completed");
        } catch (error: unknown) {
            const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setMessage(apiMessage || "Your recording could not be submitted. Please record again."); setScreen("reviewing");
        } finally {
            submittingRef.current = false;
        }
    };

    const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

    const renderPassage = () => {
        let wordIndex = 0;
        return (assessment?.content ?? "").match(/\S+|\s+/g)?.map((part, index) => {
            if (/^\s+$/.test(part)) return <span key={index}>{part}</span>;
            const currentIndex = wordIndex++;
            const baseClass = "rounded px-0.5 transition-colors duration-300 ease-out";
            const highlightClass = screen !== "recording" || currentIndex > lastReadWord
                ? "text-slate-700"
                : incorrectWords.includes(currentIndex)
                    ? `${baseClass} bg-rose-200 text-rose-900 ring-1 ring-rose-300`
                    : currentIndex === lastReadWord
                        ? `${baseClass} bg-amber-200 text-amber-950 ring-2 ring-amber-200`
                        : `${baseClass} bg-emerald-100 text-emerald-900`;
            return <span key={index} className={highlightClass}>{part}</span>;
        });
    };

    if (screen === "loading") return <div className="flex min-h-screen items-center justify-center bg-slate-100"><span className="loading loading-spinner loading-md text-emerald-700" /></div>;
    if (!assessment) return <div className="min-h-screen bg-slate-100 p-6"><p className="text-sm text-red-600">{message}</p></div>;
    const result = assessment.assessment;

    return <div className="min-h-screen bg-slate-100 p-3 sm:p-6"><div className="mx-auto max-w-4xl"><button type="button" onClick={() => navigate("/student/module")} className="mb-3 text-sm font-medium text-emerald-700">Back to modules</button>
        <Card className="border-t-4 border-emerald-800 shadow-sm"><CardHeader><CardTitle>{assessment.title}</CardTitle><CardDescription>Read the passage aloud, review your recording, then submit it for server-side transcription.</CardDescription></CardHeader><CardContent>
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-lg leading-9 sm:p-8 sm:text-xl sm:leading-10">{renderPassage()}</div>
            {screen === "recording" && <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"><span>Microphone is recording · Follow the highlighted word as you read{!liveHighlightAvailable && <span className="block text-xs text-slate-500">Live highlighting is unavailable in this browser; your recording will continue normally.</span>}</span><span className="font-mono font-semibold">{formatTime(elapsed)}</span></div>}
            {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
            <div className="mt-6 flex flex-wrap gap-3">{(screen === "ready" || screen === "failed") && <button type="button" onClick={() => void startRecording()} className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Start assessment</button>}{screen === "recording" && <button type="button" onClick={stopRecording} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">Stop recording</button>}{screen === "reviewing" && <><button type="button" onClick={() => void startRecording()} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">Record again</button><button type="button" onClick={() => void submit()} className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Submit assessment</button></>}{screen === "processing" && <span className="flex items-center gap-2 text-sm text-slate-600"><span className="loading loading-spinner loading-sm text-emerald-700" />Processing your reading...</span>}</div>
            {screen === "reviewing" && audioUrl && <audio controls src={audioUrl} className="mt-5 w-full" />}
        </CardContent></Card>
        {screen === "completed" && result && <Card className="mt-4 border-t-4 border-emerald-800 shadow-sm"><CardHeader><CardTitle>Your result</CardTitle><CardDescription>Based on the submitted recording.</CardDescription></CardHeader><CardContent><div className="flex flex-col items-center gap-5 sm:flex-row"><div className="text-center"><RadialProgress value={result.accuracy} size="lg" /><p className="mt-2 text-sm font-medium text-slate-600">Accuracy</p></div><div className="grid flex-1 grid-cols-3 gap-3 text-center text-sm"><div><p className="font-semibold text-slate-800">{result.correct_words}</p><p className="text-slate-500">Correct</p></div><div><p className="font-semibold text-slate-800">{result.incorrect_words}</p><p className="text-slate-500">Incorrect</p></div><div><p className="font-semibold text-slate-800">{result.total_words}</p><p className="text-slate-500">Total</p></div></div></div><div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm leading-7">{result.word_results.map((word, index) => <span key={index} className={word.correct ? "mr-1 text-emerald-700" : "mr-1 bg-red-100 text-red-700"}>{word.word} </span>)}</div><p className="mt-5 text-sm text-slate-600"><span className="font-medium">Transcription:</span> {result.transcription}</p><audio controls src={result.audio_url} className="mt-4 w-full" /></CardContent></Card>}
    </div></div>;
}
