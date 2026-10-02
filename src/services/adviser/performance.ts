import type { AdviserAssessment } from "./assessment.services";

export const PERFORMANCE_LEVELS = [
    "Highly Confident",
    "Confident",
    "Developing",
    "Needs Improvement",
] as const;

export type PerformanceLevel = typeof PERFORMANCE_LEVELS[number];

export function getPerformanceColor(level: PerformanceLevel): string {
    switch (level) {
        case "Highly Confident": return "#059669";
        case "Confident": return "#0284c7";
        case "Developing": return "#d97706";
        case "Needs Improvement": return "#e11d48";
    }
}

export function getPerformanceBadgeClass(level: PerformanceLevel): string {
    switch (level) {
        case "Highly Confident": return "border-emerald-200 bg-emerald-50 text-emerald-800";
        case "Confident": return "border-sky-200 bg-sky-50 text-sky-800";
        case "Developing": return "border-amber-200 bg-amber-50 text-amber-800";
        case "Needs Improvement": return "border-rose-200 bg-rose-50 text-rose-800";
    }
}

export interface StudentPerformance {
    studentId: number;
    name: string;
    studentCode: string;
    section: string | null;
    averageAccuracy: number;
    performanceLevel: PerformanceLevel;
    assessmentCount: number;
    assessments: AdviserAssessment[];
}

export function getPerformanceLevel(percentage: number): PerformanceLevel {
    if (percentage >= 90) return "Highly Confident";
    if (percentage >= 75) return "Confident";
    if (percentage >= 50) return "Developing";
    return "Needs Improvement";
}

export function calculateStudentPerformance(records: AdviserAssessment[]): StudentPerformance[] {
    const byStudent = new Map<number, AdviserAssessment[]>();
    const seenAssessmentIds = new Set<number>();

    for (const record of records) {
        const score = Number(record.accuracy);
        if (record.status !== "completed" || !Number.isFinite(score) || score < 0 || score > 100 || seenAssessmentIds.has(record.id)) continue;
        seenAssessmentIds.add(record.id);
        const assessments = byStudent.get(record.student_id) ?? [];
        assessments.push(record);
        byStudent.set(record.student_id, assessments);
    }

    return Array.from(byStudent.entries()).map(([studentId, assessments]) => {
        const averageAccuracy = Math.round(assessments.reduce((sum, item) => sum + Number(item.accuracy), 0) / assessments.length);
        const first = assessments[0];
        return {
            studentId,
            name: first.student.name,
            studentCode: first.student.student_code,
            section: first.student.section,
            averageAccuracy,
            performanceLevel: getPerformanceLevel(averageAccuracy),
            assessmentCount: assessments.length,
            assessments,
        };
    });
}
