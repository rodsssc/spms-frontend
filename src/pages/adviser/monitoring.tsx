import { useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "../../../@/components/ui/chart";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../../@/components/ui/card";

/* =========================================================
   TYPES
========================================================= */
interface ModuleStatusRow {
    moduleId: number;
    moduleTitle: string;
    grade: string;
    independent: number;
    instructional: number;
    frustration: number;
}

interface ScriptWpmRow {
    scriptTitle: string;
    avgWpm: number;
}

interface SectionCompletionRow {
    sectionName: string;
    completed: number;
    pending: number;
    total: number;
}

interface StudentCompletionRow {
    studentId: string;
    name: string;
    status: "Completed" | "Pending" | "Not Compliant";
    dateCompleted?: string;
}

/* =========================================================
   MOCK DATA (static)
   TODO: replace with real aggregates once the API is wired up.
========================================================= */
const ALL_SECTIONS = "All Sections";
const ALL_MODULES = "All Modules";

const MOCK_MODULE_STATUS: ModuleStatusRow[] = [
    { moduleId: 1, moduleTitle: "Module 1", grade: "Grade 6", independent: 14, instructional: 8, frustration: 3 },
    { moduleId: 2, moduleTitle: "Module 2", grade: "Grade 6", independent: 10, instructional: 11, frustration: 5 },
    { moduleId: 3, moduleTitle: "Module 1", grade: "Grade 5", independent: 6, instructional: 9, frustration: 9 },
];

// Same shape as MOCK_MODULE_STATUS, broken down per section, for the header filter.
// TODO: replace with a real per-section API call.
const MOCK_STATUS_BY_SECTION: Record<string, ModuleStatusRow[]> = {
    "Section Rizal": [
        { moduleId: 1, moduleTitle: "Module 1", grade: "Grade 6", independent: 9, instructional: 5, frustration: 2 },
        { moduleId: 2, moduleTitle: "Module 2", grade: "Grade 6", independent: 6, instructional: 6, frustration: 3 },
    ],
    "Section Bonifacio": [
        { moduleId: 1, moduleTitle: "Module 1", grade: "Grade 6", independent: 5, instructional: 3, frustration: 1 },
        { moduleId: 2, moduleTitle: "Module 2", grade: "Grade 6", independent: 4, instructional: 5, frustration: 2 },
    ],
    "Section Mabini": [
        { moduleId: 3, moduleTitle: "Module 1", grade: "Grade 5", independent: 6, instructional: 9, frustration: 9 },
    ],
};

const SECTION_OPTIONS = [ALL_SECTIONS, ...Object.keys(MOCK_STATUS_BY_SECTION)];
const MODULE_OPTIONS = [ALL_MODULES, ...Array.from(new Set(MOCK_MODULE_STATUS.map((m) => m.moduleTitle)))];

const MOCK_SCRIPT_WPM: Record<number, ScriptWpmRow[]> = {
    1: [
        { scriptTitle: "The Lost Kite", avgWpm: 88 },
        { scriptTitle: "How Bees Make Honey", avgWpm: 74 },
        { scriptTitle: "The Farmer and the Snake", avgWpm: 91 },
    ],
    2: [
        { scriptTitle: "A Trip to the Mountains", avgWpm: 80 },
        { scriptTitle: "Taking Care of Our Rivers", avgWpm: 69 },
    ],
    3: [
        { scriptTitle: "The Clever Crow", avgWpm: 62 },
        { scriptTitle: "Our Barangay Fiesta", avgWpm: 71 },
    ],
};

// Sections assigned to each module, with how many students completed vs pending
const MOCK_MODULE_SECTIONS: Record<number, SectionCompletionRow[]> = {
    1: [
        { sectionName: "Section Rizal", completed: 22, pending: 3, total: 25 },
        { sectionName: "Section Bonifacio", completed: 18, pending: 7, total: 25 },
    ],
    2: [
        { sectionName: "Section Rizal", completed: 20, pending: 5, total: 25 },
        { sectionName: "Section Bonifacio", completed: 15, pending: 10, total: 25 },
    ],
    3: [
        { sectionName: "Section Mabini", completed: 12, pending: 12, total: 24 },
    ],
};

// Students per module + section, with their completion status.
// TODO: replace with a real API call keyed by moduleId + sectionName.
const MOCK_SECTION_STUDENTS: Record<number, Record<string, StudentCompletionRow[]>> = {
    1: {
        "Section Rizal": [
            { studentId: "STU-001", name: "Juan Dela Cruz", status: "Completed", dateCompleted: "Aug 18, 2026" },
            { studentId: "STU-002", name: "Maria Santos", status: "Completed", dateCompleted: "Aug 19, 2026" },
            { studentId: "STU-005", name: "Liza Fernandez", status: "Pending" },
            { studentId: "STU-006", name: "Carlo Mendoza", status: "Not Compliant" },
        ],
        "Section Bonifacio": [
            { studentId: "STU-003", name: "Pedro Garcia", status: "Completed", dateCompleted: "Aug 17, 2026" },
            { studentId: "STU-004", name: "Ana Reyes", status: "Pending" },
            { studentId: "STU-007", name: "Ella Ramos", status: "Pending" },
        ],
    },
    2: {
        "Section Rizal": [
            { studentId: "STU-001", name: "Juan Dela Cruz", status: "Completed", dateCompleted: "Aug 20, 2026" },
            { studentId: "STU-002", name: "Maria Santos", status: "Pending" },
            { studentId: "STU-005", name: "Liza Fernandez", status: "Pending" },
        ],
        "Section Bonifacio": [
            { studentId: "STU-003", name: "Pedro Garcia", status: "Completed", dateCompleted: "Aug 21, 2026" },
            { studentId: "STU-004", name: "Ana Reyes", status: "Not Compliant" },
        ],
    },
    3: {
        "Section Mabini": [
            { studentId: "STU-008", name: "Miguel Torres", status: "Completed", dateCompleted: "Aug 15, 2026" },
            { studentId: "STU-009", name: "Bea Villanueva", status: "Not Compliant" },
            { studentId: "STU-010", name: "Josh Aquino", status: "Pending" },
        ],
    },
};

const STUDENT_STATUS_STYLES: Record<StudentCompletionRow["status"], { icon: string; text: string; chip: string }> = {
    Completed: { icon: "fa-solid fa-circle-check", text: "text-emerald-600", chip: "bg-emerald-50" },
    Pending: { icon: "fa-solid fa-clock", text: "text-amber-600", chip: "bg-amber-50" },
    "Not Compliant": { icon: "fa-solid fa-circle-exclamation", text: "text-red-600", chip: "bg-red-50" },
};

/* =========================================================
   CHART CONFIGS
========================================================= */
const statusChartConfig = {
    independent: {
        label: "Independent",
        color: "#059669",
    },
    instructional: {
        label: "Instructional",
        color: "#f59e0b",
    },
    frustration: {
        label: "Frustration",
        color: "#ef4444",
    },
} satisfies ChartConfig;

const wpmChartConfig = {
    avgWpm: {
        label: "Avg WPM",
        color: "#059669",
    },
} satisfies ChartConfig;

const completionChartConfig = {
    completed: {
        label: "Completed",
        color: "#059669",
    },
    pending: {
        label: "Pending",
        color: "#cbd5e1",
    },
} satisfies ChartConfig;

/* =========================================================
   HELPERS
========================================================= */
function totalStudents(rows: ModuleStatusRow) {
    return rows.independent + rows.instructional + rows.frustration;
}

function independentSharePct(rows: ModuleStatusRow) {
    const total = totalStudents(rows);
    return total === 0 ? 0 : Math.round((rows.independent / total) * 100);
}

function sectionTotals(sections: SectionCompletionRow[]) {
    return sections.reduce(
        (acc, s) => ({
            completed: acc.completed + s.completed,
            total: acc.total + s.total,
        }),
        { completed: 0, total: 0 }
    );
}

/* =========================================================
   PAGE
========================================================= */
export default function Monitoring() {
    const [selectedSection, setSelectedSection] = useState<string>(ALL_SECTIONS);
    const [selectedModule, setSelectedModule] = useState<string>(ALL_MODULES);

    const studentListModalRef = useRef<HTMLDialogElement>(null);
    const [activeStudentList, setActiveStudentList] = useState<{
        moduleTitle: string;
        grade: string;
        sectionName: string;
        students: StudentCompletionRow[];
    } | null>(null);

    function openStudentListModal(moduleId: number, moduleTitle: string, grade: string, sectionName: string) {
        const students = MOCK_SECTION_STUDENTS[moduleId]?.[sectionName] ?? [];
        setActiveStudentList({ moduleTitle, grade, sectionName, students });
        studentListModalRef.current?.showModal();
    }

    function closeStudentListModal() {
        studentListModalRef.current?.close();
        setActiveStudentList(null);
    }

    const sectionFilteredStatus =
        selectedSection === ALL_SECTIONS
            ? MOCK_MODULE_STATUS
            : MOCK_STATUS_BY_SECTION[selectedSection] ?? [];

    const filteredModuleStatus =
        selectedModule === ALL_MODULES
            ? sectionFilteredStatus
            : sectionFilteredStatus.filter((row) => row.moduleTitle === selectedModule);

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2">
            <div className="mx-auto w-full max-w-7xl">

                {/* =====================================================
                    PAGE HEADER
                ====================================================== */}
                <div className="mb-5 flex flex-col gap-3 rounded-xl border-t-4 border-emerald-800 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                            Monitoring
                        </h1>
                        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                            Reading fluency status and completion across modules
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <label htmlFor="section-filter" className="text-xs font-medium text-slate-500">
                            Section
                        </label>
                        <select
                            id="section-filter"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        >
                            {SECTION_OPTIONS.map((section) => (
                                <option key={section} value={section}>
                                    {section}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* =====================================================
                    STATUS DISTRIBUTION PER MODULE
                ====================================================== */}
                <Card className="mb-5 gap-4 border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5">
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold text-slate-700">
                                    Fluency Status by Module
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Students per Phil-IRI level, based on latest assessments
                                    {selectedSection !== ALL_SECTIONS && ` — ${selectedSection}`}
                                </CardDescription>
                            </div>

                            <div className="flex items-center gap-2">
                                <label htmlFor="module-filter" className="text-xs font-medium text-slate-500">
                                    Module
                                </label>
                                <select
                                    id="module-filter"
                                    value={selectedModule}
                                    onChange={(e) => setSelectedModule(e.target.value)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                >
                                    {MODULE_OPTIONS.map((module) => (
                                        <option key={module} value={module}>
                                            {module}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {filteredModuleStatus.length === 0 ? (
                            <p className="py-10 text-center text-xs text-slate-400">
                                No data for this selection yet.
                            </p>
                        ) : (
                            <ChartContainer config={statusChartConfig} className="h-72 w-full">
                                <LineChart
                                    data={filteredModuleStatus}
                                    margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="moduleTitle" />
                                    <YAxis allowDecimals={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Line
                                        type="monotone"
                                        dataKey="independent"
                                        stroke="var(--color-independent)"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="instructional"
                                        stroke="var(--color-instructional)"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="frustration"
                                        stroke="var(--color-frustration)"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* =====================================================
                    PER MODULE: SECTION COMPLETION + SCRIPT WPM
                ====================================================== */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                    {MOCK_MODULE_STATUS.map((module) => {
                        const sections = MOCK_MODULE_SECTIONS[module.moduleId] ?? [];
                        const { completed, total } = sectionTotals(sections);
                        const overallCompletionPct = total === 0 ? 0 : Math.round((completed / total) * 100);
                        const independentPct = independentSharePct(module);

                        return (
                            <Card
                                key={module.moduleId}
                                className="gap-4 border-t-2 border-t-emerald-800 py-4 shadow-sm"
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-sm font-semibold text-slate-700">
                                                {module.moduleTitle}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                {module.grade}
                                            </CardDescription>
                                        </div>

                                        {/* Quick-read stat chip */}
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                independentPct >= 60
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : independentPct >= 35
                                                        ? "bg-amber-50 text-amber-700"
                                                        : "bg-red-50 text-red-700"
                                            }`}
                                        >
                                            {independentPct}% Independent
                                        </span>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex flex-col gap-4">

                                    {/* Section completion (completed vs pending) */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-xs font-medium text-slate-500">
                                                Completion by Section
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                <span className="font-semibold text-emerald-600">{completed}</span>/{total} overall &middot; {overallCompletionPct}%
                                            </p>
                                        </div>

                                        <ChartContainer
                                            config={completionChartConfig}
                                            className="h-40 w-full"
                                        >
                                            <BarChart
                                                data={sections}
                                                layout="vertical"
                                                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                                <XAxis type="number" allowDecimals={false} />
                                                <YAxis
                                                    type="category"
                                                    dataKey="sectionName"
                                                    width={110}
                                                />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <ChartLegend content={<ChartLegendContent />} />
                                                <Bar dataKey="completed" stackId="completion" fill="var(--color-completed)" radius={[0, 0, 0, 0]} />
                                                <Bar dataKey="pending" stackId="completion" fill="var(--color-pending)" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ChartContainer>

                                        {/* Section completion counts */}
                                        <div className="mt-2 space-y-1.5">
                                            {sections.map((section) => (
                                                <div
                                                    key={section.sectionName}
                                                    className="flex items-center justify-between text-xs"
                                                >
                                                    <span className="text-slate-600">{section.sectionName}</span>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-400">
                                                            <span className="font-semibold text-emerald-600">
                                                                {section.completed}
                                                            </span>{" "}
                                                            completed &middot;{" "}
                                                            <span className="font-semibold text-slate-500">
                                                                {section.pending}
                                                            </span>{" "}
                                                            pending
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openStudentListModal(
                                                                    module.moduleId,
                                                                    module.moduleTitle,
                                                                    module.grade,
                                                                    section.sectionName
                                                                )
                                                            }
                                                            title={`View students — ${section.sectionName}`}
                                                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                                                        >
                                                            <i className="fa-solid fa-eye text-[11px]"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Per-script average WPM */}
                                    <div>
                                        <p className="mb-2 text-xs font-medium text-slate-500">
                                            Average WPM by Script
                                        </p>

                                        <ChartContainer config={wpmChartConfig} className="h-36 w-full">
                                            <BarChart
                                                data={MOCK_SCRIPT_WPM[module.moduleId] ?? []}
                                                layout="vertical"
                                                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                                <XAxis type="number" />
                                                <YAxis
                                                    type="category"
                                                    dataKey="scriptTitle"
                                                    width={130}
                                                />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="avgWpm" fill="var(--color-avgWpm)" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ChartContainer>
                                    </div>

                                </CardContent>
                            </Card>
                        );
                    })}

                </div>

            </div>

            {/* =====================================================
                STUDENT COMPLETION LIST MODAL
            ====================================================== */}
            <dialog ref={studentListModalRef} className="modal">
                <div className="modal-box max-w-lg border-t-4 border-emerald-800">

                    {/* Modal Header */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-slate-800">
                                {activeStudentList?.sectionName ?? "Section"}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {activeStudentList
                                    ? `${activeStudentList.grade} · ${activeStudentList.moduleTitle}`
                                    : ""}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeStudentListModal}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    {/* Status summary */}
                    {activeStudentList && (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {(["Completed", "Pending", "Not Compliant"] as const).map((status) => {
                                const count = activeStudentList.students.filter((s) => s.status === status).length;
                                const style = STUDENT_STATUS_STYLES[status];
                                return (
                                    <span
                                        key={status}
                                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.chip} ${style.text}`}
                                    >
                                        <i className={style.icon}></i>
                                        {count} {status}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Student list */}
                    <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-100">
                        {activeStudentList && activeStudentList.students.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                                        <th className="px-4 py-2 font-medium">Student</th>
                                        <th className="px-4 py-2 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeStudentList.students.map((student) => {
                                        const style = STUDENT_STATUS_STYLES[student.status];
                                        return (
                                            <tr key={student.studentId} className="border-b border-slate-100 last:border-0">
                                                <td className="px-4 py-2.5">
                                                    <p className="font-medium text-slate-700">{student.name}</p>
                                                    <p className="text-xs text-slate-400">
                                                        {student.studentId}
                                                        {student.dateCompleted && ` · ${student.dateCompleted}`}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
                                                        <i className={style.icon}></i>
                                                        {student.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p className="px-4 py-8 text-center text-xs text-slate-400">
                                No students found for this section.
                            </p>
                        )}
                    </div>

                </div>

                {/* Backdrop click to close */}
                <form method="dialog" className="modal-backdrop">
                    <button onClick={closeStudentListModal}>close</button>
                </form>
            </dialog>

        </div>
    );
}