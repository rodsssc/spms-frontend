import { useEffect, useState } from "react";
import { getAssessments, type AdviserAssessment } from "../../services/adviser/assessment.services";
import { calculateStudentPerformance, getPerformanceBadgeClass, getPerformanceLevel, PERFORMANCE_LEVELS, type PerformanceLevel, type StudentPerformance } from "../../services/adviser/performance";
import AssessmentResult from "./assessment_result";

interface StudentGroup {
    id: number;
    name: string;
    studentCode: string;
    section: string | null;
    averageAccuracy: number;
    performanceLevel: PerformanceLevel;
    assessmentCount: number;
    modules: Array<{ id: number; title: string; assessments: AdviserAssessment[] }>;
}

function groupAssessments(performances: StudentPerformance[]): StudentGroup[] {
    return performances.map((performance) => {
        const modules: StudentGroup["modules"] = [];
        for (const assessment of performance.assessments) {
            let module = modules.find((item) => item.id === assessment.module_id);
            if (!module) {
                module = { id: assessment.module_id, title: assessment.module, assessments: [] };
                modules.push(module);
            }
            module.assessments.push(assessment);
        }
        return {
            id: performance.studentId,
            name: performance.name,
            studentCode: performance.studentCode,
            section: performance.section,
            averageAccuracy: performance.averageAccuracy,
            performanceLevel: performance.performanceLevel,
            assessmentCount: performance.assessmentCount,
            modules,
        };
    });
}

export default function Assessment() {
    const [assessments, setAssessments] = useState<AdviserAssessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openStudents, setOpenStudents] = useState<Set<number>>(new Set());
    const [openModules, setOpenModules] = useState<Set<string>>(new Set());
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedSection, setSelectedSection] = useState("all");
    const [selectedPerformance, setSelectedPerformance] = useState<PerformanceLevel | "all">("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        let active = true;
        getAssessments()
            .then((records) => {
                if (!active) return;
                setAssessments(records);
                const first = records[0];
                if (first) setOpenModules(new Set([`${first.student_id}:${first.module_id}`]));
            })
            .catch(() => active && setError("Unable to load assessment results."))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const performances = calculateStudentPerformance(assessments);
    const sections = Array.from(new Set(performances.map((item) => item.section).filter((section): section is string => Boolean(section)))).sort((a, b) => a.localeCompare(b));
    const students = groupAssessments(performances.filter((student) => {
        const matchesSection = selectedSection === "all" || student.section === selectedSection;
        const matchesPerformance = selectedPerformance === "all" || student.performanceLevel === selectedPerformance;
        const query = search.trim().toLocaleLowerCase();
        const matchesSearch = !query || `${student.name} ${student.studentCode} ${student.section ?? ""}`.toLocaleLowerCase().includes(query);
        return matchesSection && matchesPerformance && matchesSearch;
    }));

    return (
        <div className="w-full p-3 sm:p-4 lg:p-2">
            <div className="mx-auto w-full max-w-7xl">
                <div className="mb-5 rounded-xl border-t-4 border-emerald-800 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4">
                        <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">Assessment Results</h1>
                        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Review student reading results and progress by module</p>
                    </div>
                    <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
                        <label className="input input-bordered flex w-full min-w-0 flex-1 items-center gap-2 bg-slate-50 focus-within:border-emerald-500">
                            <i className="fa-solid fa-magnifying-glass shrink-0 text-sm text-slate-400" />
                            <input aria-label="Search students" type="search" placeholder="Search by student name or ID..." className="min-w-0 grow" value={search} onChange={(event) => setSearch(event.target.value)} />
                        </label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <label className="flex items-center gap-2"><span className="text-sm font-medium text-slate-700">Section</span>
                            <select id="assessment-section-filter" value={selectedSection} onChange={(event) => setSelectedSection(event.target.value)} className="select select-bordered w-full bg-white sm:w-44">
                                <option value="all">All sections</option>
                                {sections.map((section) => <option key={section} value={section}>{section}</option>)}
                            </select>
                            </label>
                            <label className="flex items-center gap-2"><span className="whitespace-nowrap text-sm font-medium text-slate-700">Performance</span>
                            <select aria-label="Filter by performance level" value={selectedPerformance} onChange={(event) => setSelectedPerformance(event.target.value as PerformanceLevel | "all")} className="select select-bordered w-full bg-white sm:w-52">
                                <option value="all">All performance levels</option>
                                {PERFORMANCE_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                            </select>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border-t-4 border-emerald-800 bg-white shadow-sm">
                    {loading ? <div className="flex justify-center py-16"><span className="loading loading-spinner text-emerald-700" /></div>
                        : error ? <p className="px-5 py-8 text-sm text-red-600">{error}</p>
                        : students.length === 0 ? <div className="px-5 py-10 text-center"><p className="text-sm font-semibold text-slate-700">No assessment results</p><p className="mt-1 text-sm text-slate-500">No submitted assessments match this section yet.</p></div>
                        : <div className="divide-y divide-slate-200">{students.map((student) => {
                            const studentOpen = openStudents.has(student.id);
                            return <section key={student.id}>
                                <button type="button" aria-expanded={studentOpen} onClick={() => setOpenStudents((previous) => { const next = new Set(previous); if (next.has(student.id)) next.delete(student.id); else next.add(student.id); return next; })} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 sm:px-6">
                                    <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{student.name}</span><span className="mt-0.5 block text-xs text-slate-500">{student.studentCode} · {student.section ?? "No section"}</span><span className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600"><span>Overall Performance: <strong>{student.averageAccuracy}%</strong></span><span className={`rounded-full border px-2 py-0.5 font-semibold ${getPerformanceBadgeClass(student.performanceLevel)}`}>{student.performanceLevel}</span><span>{student.assessmentCount} completed {student.assessmentCount === 1 ? "assessment" : "assessments"}</span></span></span>
                                    <i className={`fa-solid fa-chevron-down shrink-0 text-xs text-slate-400 transition-transform ${studentOpen ? "rotate-180" : ""}`} />
                                </button>
                                {studentOpen && <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                                    {student.modules.map((module) => {
                                        const key = `${student.id}:${module.id}`;
                                        const isOpen = openModules.has(key);
                                        return <section key={key} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                            <button type="button" aria-expanded={isOpen} onClick={() => setOpenModules((previous) => { const next = new Set(previous); if (next.has(key)) next.delete(key); else next.add(key); return next; })} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50">
                                                <span><span className="block text-sm font-semibold text-slate-700">{module.title}</span><span className="text-xs text-slate-500">{module.assessments.length} {module.assessments.length === 1 ? "assessment" : "assessments"}</span></span>
                                                <i className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                            </button>
                                            {isOpen && <div className="divide-y divide-slate-100 border-t border-slate-100">
                                                {module.assessments.map((item) => <div key={item.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-700">{item.script_title}</p><p className="mt-0.5 text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()} · {new Date(item.created_at).toLocaleTimeString()}</p></div>
                                                    <div className="flex items-center justify-between gap-4 sm:justify-end"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getPerformanceBadgeClass(getPerformanceLevel(item.accuracy))}`}>{item.accuracy}% · {getPerformanceLevel(item.accuracy)}</span><button type="button" onClick={() => setSelectedId(item.id)} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50">View result</button></div>
                                                </div>)}
                                            </div>}
                                        </section>;
                                    })}
                                </div>}
                            </section>;
                        })}</div>}
                </div>
            </div>
            {selectedId !== null && <AssessmentResult assessmentId={selectedId} onClose={() => setSelectedId(null)} />}
        </div>
    );
}
