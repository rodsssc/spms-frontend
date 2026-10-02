import api from "../../config/axios";

export interface AssessmentResult {
    id: number;
    transcription: string;
    accuracy: number;
    total_words: number;
    correct_words: number;
    incorrect_words: number;
    status: string;
    created_at: string;
    audio_url: string;
    word_results: Array<{ word: string; correct: boolean }>;
}

export interface AssessmentScript {
    id: number;
    title: string;
    module_id: number;
    content: string;
    assessment: AssessmentResult | null;
}

export const getAssessment = async (scriptId: string) => {
    const response = await api.get<{ assessment: AssessmentScript }>(`/api/student/assessments/${scriptId}`);
    return response.data.assessment;
};

export const submitAssessment = async (scriptId: number, audio: Blob) => {
    const formData = new FormData();
    formData.append("audio", audio, "reading.webm");
    const response = await api.post<{ assessment: AssessmentScript }>(
        `/api/student/assessments/${scriptId}/submit`,
        formData
    );
    return response.data.assessment;
};