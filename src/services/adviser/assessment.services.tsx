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
    created_at: string;
    script?: string;
    transcription?: string;
    audio_url?: string;
}

export const getAssessments = async () => (await api.get<{ assessments: AdviserAssessment[] }>("/api/adviser/assessments")).data.assessments;
export const getAssessment = async (id: string) => (await api.get<{ assessment: AdviserAssessment }>(`/api/adviser/assessments/${id}`)).data.assessment;
export const getAssessmentAudio = async (id: string) =>
    (await api.get(`/api/adviser/assessments/${id}/audio`, { responseType: "blob" })).data as Blob;
