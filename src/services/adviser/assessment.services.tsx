import api from "../../config/axios";

export interface AdviserAssessment {
    id: number;
    student_id: number;
    module_id: number;
    student: { name: string; student_code: string; section: string | null };
    module: string;
    script_title: string;
    accuracy: number;
    correct_words: number;
    incorrect_words: number;
    total_words: number;
    status: string;
    fluency_rating: "fluent" | "developing" | "needs_support" | null;
    review_note: string | null;
    reviewed_at: string | null;
    created_at: string;
    script?: string;
    transcription?: string;
    audio_url?: string;
}

export const getAssessments = async () => (await api.get<{ assessments: AdviserAssessment[] }>("/api/adviser/assessments")).data.assessments;
export const getAssessment = async (id: string) => (await api.get<{ assessment: AdviserAssessment }>(`/api/adviser/assessments/${id}`)).data.assessment;
export const getAssessmentAudio = async (id: string) =>
    (await api.get(`/api/adviser/assessments/${id}/audio`, { responseType: "blob" })).data as Blob;
export const reviewAssessment = async (id: string, fluencyRating: "fluent" | "developing" | "needs_support" | null, reviewNote: string) =>
    (await api.put<{ assessment: AdviserAssessment }>(`/api/adviser/assessments/${id}/review`, {
        fluency_rating: fluencyRating,
        review_note: reviewNote || null,
    })).data.assessment;
