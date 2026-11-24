import { useEffect, useState } from "react";
import { getAssessment, getAssessmentAudio, reviewAssessment, type AdviserAssessment } from "../../services/adviser/assessment.services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../@/components/ui/card";
import RadialProgress from "../../components/radial_progress";
import { getPerformanceBadgeClass, getPerformanceLevel } from "../../services/adviser/performance";
import { errorMessage } from "../../services/superadmin/common.services";

interface AssessmentResultProps {
    assessmentId: number;
    onClose: () => void;
    onAssessmentUpdated?: (assessment: AdviserAssessment) => void;
}

export default function AssessmentResult({ assessmentId, onClose, onAssessmentUpdated }: AssessmentResultProps) {
    const [assessment, setAssessment] = useState<AdviserAssessment | null>(null);
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [reviewNote, setReviewNote] = useState("");
    const [reviewRating, setReviewRating] = useState<"fluent" | "developing" | "needs_support" | null>(null);
    const [savingReview, setSavingReview] = useState(false);
    const [reviewMessage, setReviewMessage] = useState("");

    useEffect(() => {
        let active = true;
        setAssessment(null);
        setAudioSrc(null);
        setError("");
        getAssessment(String(assessmentId))
            .then((record) => {
                if (!active) return;
                setAssessment(record);
                setReviewNote(record.review_note ?? "");
                setReviewRating(record.fluency_rating);
            })
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

    const saveReview = async () => {
        if (!assessment) return;
        setSavingReview(true);
        setReviewMessage("");
        try {
            const updated = await reviewAssessment(String(assessment.id), reviewRating, reviewNote.trim());
            setAssessment(updated);
            setReviewNote(updated.review_note ?? "");
            setReviewRating(updated.fluency_rating);
            onAssessmentUpdated?.(updated);
            setReviewMessage("Adviser fluency review saved. The automatic accuracy score is unchanged.");
        } catch (error) {
            setReviewMessage(errorMessage(error));
        } finally {
            setSavingReview(false);
        }
    };

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
                                <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle>Fluency</CardTitle><CardDescription>Rate the student's reading separately from the automatic accuracy score.</CardDescription></CardHeader><CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {([ ["fluent", "Fluent"], ["developing", "Developing"], ["needs_support", "Needs support"] ] as const).map(([rating, label]) => <button key={rating} type="button" disabled={savingReview} onClick={() => setReviewRating(rating)} aria-pressed={reviewRating === rating} className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${reviewRating === rating ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{label}</button>)}
                                    </div>
                                </CardContent></Card>
                                <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle>Remarks</CardTitle><CardDescription>Optional notes about the student's reading.</CardDescription></CardHeader><CardContent>
                                    <textarea aria-label="Assessment remarks" className="textarea textarea-bordered w-full" rows={3} maxLength={2000} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Add remarks about the student's reading" />
                                    <div className="mt-3 flex items-center justify-between gap-3"><p role="status" className="text-xs text-slate-500">{reviewMessage || (assessment.reviewed_at ? `Last reviewed ${new Date(assessment.reviewed_at).toLocaleString()}` : "Not saved yet")}</p><button type="button" disabled={savingReview || (!reviewRating && !reviewNote.trim() && !assessment.review_note)} onClick={() => void saveReview()} className="btn btn-sm border-emerald-600 bg-emerald-600 text-white">{savingReview ? "Saving..." : "Save review"}</button></div>
                                </CardContent></Card>
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
