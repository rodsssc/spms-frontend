import { useEffect, useState } from "react";
import { getAssessment, getAssessmentAudio, type AdviserAssessment } from "../../services/adviser/assessment.services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../@/components/ui/card";
import RadialProgress from "../../components/radial_progress";
import { getPerformanceBadgeClass, getPerformanceLevel } from "../../services/adviser/performance";

interface AssessmentResultProps {
    assessmentId: number;
    onClose: () => void;
}

export default function AssessmentResult({ assessmentId, onClose }: AssessmentResultProps) {
    const [assessment, setAssessment] = useState<AdviserAssessment | null>(null);
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setAssessment(null);
        setAudioSrc(null);
        setError("");
        getAssessment(String(assessmentId))
            .then((record) => active && setAssessment(record))
            .catch(() => active && setError("Unable to load this result."));
        return () => { active = false; };
    }, [assessmentId]);

    useEffect(() => {
        if (!assessment?.audio_url) return;
        let active = true;
        let objectUrl: string | undefined;
        getAssessmentAudio(String(assessmentId))
            .then((blob) => {
                if (!active) return;
                objectUrl = URL.createObjectURL(blob);
                setAudioSrc(objectUrl);
            })
            .catch(() => active && setAudioSrc(null));
        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [assessment, assessmentId]);

    const submitted = assessment ? new Date(assessment.created_at) : null;
    const performanceLevel = assessment ? getPerformanceLevel(assessment.accuracy) : null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <aside role="dialog" aria-modal="true" aria-label="Assessment result" className="h-full w-full max-w-2xl overflow-y-auto bg-slate-100 p-4 shadow-xl sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Assessment Result</h2>
                    <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white">Close</button>
                </div>
                {error ? <p className="py-8 text-sm text-red-600">{error}</p> : !assessment ? <div className="flex justify-center py-16"><span className="loading loading-spinner text-emerald-700" /></div> : (
                    <>
                        <p className="mb-5 text-sm text-slate-500">{assessment.student.name} · {assessment.student.student_code} · {assessment.student.section ?? "No section"}</p>
                        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Module</p><p className="mt-1 font-medium text-slate-700">{assessment.module}</p></div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Script</p><p className="mt-1 font-medium text-slate-700">{assessment.script_title}</p></div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Assessment date</p><p className="mt-1 font-medium text-slate-700">{submitted?.toLocaleDateString()}</p></div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Assessment time</p><p className="mt-1 font-medium text-slate-700">{submitted?.toLocaleTimeString()}</p></div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
                            <Card className={`border-t-4 shadow-sm ${performanceLevel === "Needs Improvement" ? "border-t-rose-500" : "border-t-emerald-800"}`}>
                                <CardHeader><CardTitle>Result</CardTitle><CardDescription>Assessment score</CardDescription></CardHeader>
                                <CardContent className="flex flex-col items-center">
                                    <RadialProgress value={assessment.accuracy} size="lg" />
                                    <p className="mt-2 text-sm font-semibold text-slate-700">Accuracy: {assessment.accuracy}%</p>
                                    <span className={`mt-2 rounded-full border px-3 py-1 text-xs font-semibold ${getPerformanceBadgeClass(performanceLevel!)}`}>{performanceLevel}</span>
                                    {performanceLevel === "Needs Improvement" && <p role="status" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-medium text-rose-800">This result is below 50%. Consider follow-up support for this student.</p>}
                                    <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center text-sm">
                                        <div><p className="font-semibold">{assessment.correct_words}</p><p className="text-slate-500">Correct</p></div>
                                        <div><p className="font-semibold">{assessment.incorrect_words}</p><p className="text-slate-500">Incorrect</p></div>
                                        <div><p className="font-semibold">{assessment.total_words}</p><p className="text-slate-500">Total</p></div>
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="space-y-4">
                                <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle>Original script</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{assessment.script}</p></CardContent></Card>
                                <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle>Student assessment result</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{assessment.transcription}</p></CardContent></Card>
                                <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle>Audio recording</CardTitle></CardHeader><CardContent>{audioSrc ? <audio controls src={audioSrc} className="w-full" /> : <p className="text-sm text-slate-500">Audio unavailable.</p>}</CardContent></Card>
                            </div>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
}
