import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
    type ChartConfig,
    ChartContainer,
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
type ScriptStatus = "Completed" | "Pending" | "Non-Compliant";
type StudentStatus = "Not Started" | "In Progress" | "Completed" | "Non-Compliant";

interface ModuleItem {
    id: number;
    grade: string;
    name: string;
    schoolYear: string;
    dueDate: string;
    sections: string[];
}

interface Script {
    id: number;
    moduleId: number;
    title: string;
    order: number;
    dueDate: string;
    avgScore: number | null;
    status: ScriptStatus;
}

interface StatCard {
    label: string;
    value: string;
    subtext: string;
    icon: string;
}

interface StudentProgress {
    id: number;
    name: string;
    studentId: string;
    section: string;
    currentScript: string;
    status: StudentStatus;
    lastActivity: string;
}

type TabKey = "overview" | "scripts" | "students";

/* =========================================================
   MOCK DATA (static)
   TODO: replace with real API data once wired up.
========================================================= */
const MODULES: ModuleItem[] = [
    { id: 1, grade: "Grade 6", name: "Module 1", schoolYear: "2026–2027", dueDate: "Sep 12, 2026", sections: ["Section Mabini", "Section Silang"] },
    { id: 2, grade: "Grade 6", name: "Module 2", schoolYear: "2026–2027", dueDate: "Oct 3, 2026", sections: ["Section Mabini"] },
    { id: 3, grade: "Grade 5", name: "Module 1", schoolYear: "2026–2027", dueDate: "Sep 15, 2026", sections: ["Section Aguinaldo", "Section Luna"] },
    { id: 4, grade: "Grade 5", name: "Module 2", schoolYear: "2026–2027", dueDate: "Oct 6, 2026", sections: ["Section Luna"] },
    { id: 5, grade: "Grade 4", name: "Module 1", schoolYear: "2026–2027", dueDate: "Sep 18, 2026", sections: ["Section Rizal", "Section Bonifacio"] },
    { id: 6, grade: "Grade 4", name: "Module 2", schoolYear: "2026–2027", dueDate: "Oct 9, 2026", sections: ["Section Rizal"] },
];

const SCRIPTS: Script[] = [
    { id: 1, moduleId: 1, title: "Reading Script 1", order: 1, dueDate: "Aug 12, 2026", avgScore: 78, status: "Completed" },
    { id: 2, moduleId: 1, title: "Reading Script 2", order: 2, dueDate: "Aug 20, 2026", avgScore: 88, status: "Completed" },
    { id: 3, moduleId: 1, title: "Reading Script 3", order: 3, dueDate: "Sep 5, 2026", avgScore: null, status: "Non-Compliant" },
    { id: 4, moduleId: 1, title: "Reading Script 4", order: 4, dueDate: "Sep 12, 2026", avgScore: null, status: "Pending" },
    { id: 5, moduleId: 1, title: "Reading Script 5", order: 5, dueDate: "Sep 12, 2026", avgScore: null, status: "Pending" },
];

const STUDENTS: StudentProgress[] = [
    { id: 1, name: "Juan Dela Cruz", studentId: "STU-001", section: "Section Mabini", currentScript: "Reading Script 4", status: "In Progress", lastActivity: "Reading now" },
    { id: 2, name: "Maria Santos", studentId: "STU-002", section: "Section Mabini", currentScript: "Reading Script 3", status: "Non-Compliant", lastActivity: "No activity since Sep 5" },
    { id: 3, name: "Pedro Garcia", studentId: "STU-003", section: "Section Mabini", currentScript: "Reading Script 5", status: "Not Started", lastActivity: "Not yet opened" },
    { id: 4, name: "Ana Reyes", studentId: "STU-004", section: "Section Silang", currentScript: "Reading Script 2", status: "Completed", lastActivity: "Submitted Aug 20" },
    { id: 5, name: "Carlos Villanueva", studentId: "STU-005", section: "Section Silang", currentScript: "Reading Script 4", status: "In Progress", lastActivity: "Reading now" },
    { id: 6, name: "Liza Fernandez", studentId: "STU-006", section: "Section Silang", currentScript: "Reading Script 5", status: "Not Started", lastActivity: "Not yet opened" },
    { id: 7, name: "Mark Aquino", studentId: "STU-007", section: "Section Mabini", currentScript: "Reading Script 2", status: "Completed", lastActivity: "Submitted Aug 19" },
    { id: 8, name: "Grace Bautista", studentId: "STU-008", section: "Section Silang", currentScript: "Reading Script 3", status: "Non-Compliant", lastActivity: "No activity since Sep 5" },
    { id: 9, name: "Ramon Torres", studentId: "STU-009", section: "Section Mabini", currentScript: "Reading Script 4", status: "In Progress", lastActivity: "Reading now" },
    { id: 10, name: "Bea Mercado", studentId: "STU-010", section: "Section Silang", currentScript: "Reading Script 5", status: "Not Started", lastActivity: "Not yet opened" },
    { id: 11, name: "Noel Ramos", studentId: "STU-011", section: "Section Mabini", currentScript: "Reading Script 2", status: "Completed", lastActivity: "Submitted Aug 20" },
    { id: 12, name: "Ivy Castillo", studentId: "STU-012", section: "Section Silang", currentScript: "Reading Script 4", status: "In Progress", lastActivity: "Reading now" },
];

/* =========================================================
   CHART CONFIG
========================================================= */
const proficiencyChartConfig = {
    score: {
        label: "Proficiency Score",
        color: "#059669",
    },
} satisfies ChartConfig;

/* =========================================================
   STATUS DISPLAY (Font Awesome only, no badges)
========================================================= */
const SCRIPT_STATUS_STYLES: Record<ScriptStatus, { icon: string; text: string }> = {
    Completed: { icon: "fa-solid fa-circle-check", text: "text-emerald-600" },
    Pending: { icon: "fa-solid fa-clock", text: "text-amber-600" },
    "Non-Compliant": { icon: "fa-solid fa-circle-exclamation", text: "text-red-600" },
};

const STUDENT_STATUS_STYLES: Record<StudentStatus, { icon: string; text: string; live?: boolean }> = {
    "Not Started": { icon: "fa-regular fa-circle", text: "text-slate-400" },
    "In Progress": { icon: "fa-solid fa-circle", text: "text-emerald-600", live: true },
    Completed: { icon: "fa-solid fa-circle-check", text: "text-emerald-600" },
    "Non-Compliant": { icon: "fa-solid fa-circle-exclamation", text: "text-red-600" },
};

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "fa-solid fa-gauge-high" },
    { key: "scripts", label: "Scripts", icon: "fa-solid fa-book-open" },
    { key: "students", label: "Students", icon: "fa-solid fa-users" },
];

const STUDENTS_PER_PAGE = 5;

/* =========================================================
   PAGE
========================================================= */
export default function ModuleView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const addScriptModalRef = useRef<HTMLDialogElement>(null);

    const currentModule = useMemo<ModuleItem>(() => {
        return MODULES.find((m) => m.id === Number(id)) ?? MODULES[0];
    }, [id]);

    const moduleScripts = useMemo(
        () => SCRIPTS.filter((s) => s.moduleId === currentModule.id),
        [currentModule.id]
    );

    const moduleStudents = useMemo(
        () => STUDENTS.filter((s) => currentModule.sections.includes(s.section)),
        [currentModule.sections]
    );

    const [activeTab, setActiveTab] = useState<TabKey>("overview");
    const [sectionFilter, setSectionFilter] = useState("All Sections");
    const [studentSearch, setStudentSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [scriptTitle, setScriptTitle] = useState("");
    const [scriptModuleId, setScriptModuleId] = useState<number>(currentModule.id);
    const [scriptDueDate, setScriptDueDate] = useState("");

    /* -------------------------------------------------------
       Derived overview numbers
    ------------------------------------------------------- */
    const totalScripts = moduleScripts.length;
    const completedCount = moduleScripts.filter((s) => s.status === "Completed").length;
    const pendingCount = moduleScripts.filter((s) => s.status === "Pending").length;
    const nonCompliantCount = moduleScripts.filter((s) => s.status === "Non-Compliant").length;

    const overviewStats: StatCard[] = [
        { label: "Total Scripts", value: String(totalScripts), subtext: `${currentModule.name} · ${currentModule.grade}`, icon: "fa-solid fa-book" },
        { label: "Completed", value: String(completedCount), subtext: `${Math.round((completedCount / totalScripts) * 100)}% of scripts`, icon: "fa-solid fa-circle-check" },
        { label: "Pending", value: String(pendingCount), subtext: "Not yet taken", icon: "fa-solid fa-clock" },
        { label: "Non-Compliant", value: String(nonCompliantCount), subtext: "Past due, no submission", icon: "fa-solid fa-circle-exclamation" },
    ];

    const proficiencyTrend = moduleScripts.map((script) => ({
        script: `Script ${script.order}`,
        score: script.avgScore ?? 0,
    }));

    /* -------------------------------------------------------
       Students tab: search + filter + pagination
    ------------------------------------------------------- */
    const filteredStudents = useMemo(() => {
        const query = studentSearch.trim().toLowerCase();
        return moduleStudents.filter((student) => {
            const matchesSection = sectionFilter === "All Sections" || student.section === sectionFilter;
            const matchesSearch =
                query === "" ||
                student.name.toLowerCase().includes(query) ||
                student.studentId.toLowerCase().includes(query);
            return matchesSection && matchesSearch;
        });
    }, [moduleStudents, sectionFilter, studentSearch]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));

    // Reset back to page 1 whenever the filter or search changes results.
    useEffect(() => {
        setCurrentPage(1);
    }, [sectionFilter, studentSearch]);

    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * STUDENTS_PER_PAGE,
        currentPage * STUDENTS_PER_PAGE
    );

    const readingNowCount = moduleStudents.filter((s) => s.status === "In Progress").length;
    const notStartedCount = moduleStudents.filter((s) => s.status === "Not Started").length;

    /* -------------------------------------------------------
       Add Script modal
    ------------------------------------------------------- */
    function openAddScriptModal() {
        setScriptTitle("");
        setScriptModuleId(currentModule.id);
        setScriptDueDate("");
        addScriptModalRef.current?.showModal();
    }

    function closeAddScriptModal() {
        addScriptModalRef.current?.close();
    }

    function handleAddScript() {
        // TODO: wire up to real "create script" API.
        console.log("Adding script", {
            title: scriptTitle,
            moduleId: scriptModuleId,
            dueDate: scriptDueDate,
        });
        closeAddScriptModal();
    }

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2">
            <div className="mx-auto w-full max-w-7xl">

                {/* =====================================================
                    BACK LINK
                ====================================================== */}
                <button
                    type="button"
                    onClick={() => navigate("/adviser/module")}
                    className="mb-3 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-700"
                >
                    <i className="fa-solid fa-arrow-left"></i>
                    Back to Modules
                </button>

                {/* =====================================================
                    PAGE HEADER
                ====================================================== */}
                <div className="mb-5 flex flex-col items-start justify-between gap-3 rounded-xl border-t-4 border-emerald-800 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-400">{currentModule.grade}</p>
                        <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                            {currentModule.name}
                        </h1>
                        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                            {currentModule.schoolYear} &middot; Due {currentModule.dueDate}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddScriptModal}
                        className="btn shrink-0 border-emerald-600 bg-emerald-600 px-3 text-white shadow-sm hover:border-emerald-700 hover:bg-emerald-700 sm:px-4"
                    >
                        <i className="fa-solid fa-plus"></i>
                        Add Script
                    </button>
                </div>

                {/* =====================================================
                    TABS (daisyUI)
                ====================================================== */}
                <div role="tablist" className="tabs tabs-lift">
                    {TABS.map((tab) => (
                        <a
                            key={tab.key}
                            role="tab"
                            className={`tab gap-2 text-sm font-medium ${
                                activeTab === tab.key
                                    ? "tab-active text-emerald-800 [--tab-border-color:#065f46]"
                                    : "text-slate-500"
                            }`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <i className={tab.icon} />
                            {tab.label}
                        </a>
                    ))}
                </div>

                {/* =====================================================
                    TAB: OVERVIEW (dashboard-style status)
                ====================================================== */}
                {activeTab === "overview" && (
                    <div className="mt-5 space-y-4">

                        {/* Stat cards */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {overviewStats.map((stat) => (
                                <Card key={stat.label} className="gap-2 border-t-4 border-emerald-800 py-4 shadow-sm">
                                    <CardContent className="flex items-start justify-between px-5">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                                            <p className="mt-1 text-2xl font-bold text-slate-800">{stat.value}</p>
                                            <p className="mt-1 truncate text-xs text-slate-400">{stat.subtext}</p>
                                        </div>
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                                            <i className={`${stat.icon} text-emerald-700`} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Proficiency line chart + module info */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">

                            <Card className="gap-4 border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5">
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold text-slate-700">
                                        Reading Proficiency
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Average proficiency score across scripts in this module
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={proficiencyChartConfig} className="h-72 w-full">
                                        <LineChart data={proficiencyTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="script" />
                                            <YAxis allowDecimals={false} domain={[0, 100]} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Line
                                                type="monotone"
                                                dataKey="score"
                                                stroke="var(--color-score)"
                                                strokeWidth={2}
                                                dot={{ r: 4, fill: "var(--color-score)" }}
                                            />
                                        </LineChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            <Card className="gap-4 border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5">
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold text-slate-700">
                                        Module Information
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Schedule and assigned sections
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <dl className="space-y-4">
                                        <div>
                                            <dt className="text-xs font-medium text-slate-500">Grade Level</dt>
                                            <dd className="mt-0.5 text-sm text-slate-800">{currentModule.grade}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-slate-500">School Year</dt>
                                            <dd className="mt-0.5 text-sm text-slate-800">{currentModule.schoolYear}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-slate-500">Due Date</dt>
                                            <dd className="mt-0.5 text-sm text-slate-800">{currentModule.dueDate}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-slate-500">Assigned Sections</dt>
                                            <dd className="mt-1 flex flex-wrap gap-1.5">
                                                {currentModule.sections.map((section) => (
                                                    <span
                                                        key={section}
                                                        className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                                                    >
                                                        {section}
                                                    </span>
                                                ))}
                                            </dd>
                                        </div>
                                    </dl>
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                )}

                {/* =====================================================
                    TAB: SCRIPTS (list belonging to this module)
                ====================================================== */}
                {activeTab === "scripts" && (
                    <Card className="mt-5 gap-0 border-t-4 border-emerald-800 py-0 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div>
                                <h2 className="text-base font-semibold text-slate-800">Reading Scripts</h2>
                                <p className="text-xs text-slate-500">All scripts that belong to {currentModule.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddScriptModal}
                                className="btn btn-sm border-emerald-600 bg-emerald-50 text-emerald-700 shadow-none hover:border-emerald-700 hover:bg-emerald-600 hover:text-white"
                            >
                                <i className="fa-solid fa-plus"></i>
                                Add Script
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                                        <th className="px-6 py-3 font-medium">Script</th>
                                        <th className="px-6 py-3 font-medium">Due Date</th>
                                        <th className="px-6 py-3 font-medium">Avg. Score</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {moduleScripts.map((script) => {
                                        const status = SCRIPT_STATUS_STYLES[script.status];
                                        return (
                                            <tr key={script.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                <td className="px-6 py-3">
                                                    <p className="font-medium text-slate-700">{script.title}</p>
                                                    <p className="text-xs text-slate-400">Script {script.order}</p>
                                                </td>
                                                <td className="px-6 py-3 text-slate-600">{script.dueDate}</td>
                                                <td className="px-6 py-3 font-medium text-slate-700">
                                                    {script.avgScore !== null ? `${script.avgScore}%` : "—"}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`flex items-center gap-1.5 font-medium ${status.text}`}>
                                                        <i className={status.icon} />
                                                        {script.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* =====================================================
                    TAB: STUDENTS (assigned to this module, live status)
                ====================================================== */}
                {activeTab === "students" && (
                    <div className="mt-5 space-y-4">

                        {/* Quick live counts */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Card className="gap-2 border-t-4 border-emerald-800 py-4 shadow-sm">
                                <CardContent className="flex items-center gap-3 px-5">
                                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                                    </span>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Reading Now</p>
                                        <p className="text-xl font-bold text-slate-800">{readingNowCount}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="gap-2 border-t-4 border-emerald-800 py-4 shadow-sm">
                                <CardContent className="px-5">
                                    <p className="text-xs font-medium text-slate-500">Not Started</p>
                                    <p className="mt-1 text-xl font-bold text-slate-800">{notStartedCount}</p>
                                </CardContent>
                            </Card>
                            <Card className="gap-2 border-t-4 border-emerald-800 py-4 shadow-sm">
                                <CardContent className="px-5">
                                    <p className="text-xs font-medium text-slate-500">Total Assigned</p>
                                    <p className="mt-1 text-xl font-bold text-slate-800">{moduleStudents.length}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="gap-0 border-t-4 border-emerald-800 py-0 shadow-sm">
                            <div className="border-b border-slate-200 px-6 py-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-800">Assigned Students</h2>
                                        <p className="text-xs text-slate-500">Live reading status for {currentModule.name}</p>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        {/* Search */}
                                        <label className="input input-bordered flex w-full items-center gap-2 bg-slate-50 focus-within:border-emerald-500 focus-within:outline-none sm:w-56">
                                            <i className="fa-solid fa-magnifying-glass shrink-0 text-sm text-slate-400"></i>
                                            <input
                                                type="text"
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                placeholder="Search student name or ID..."
                                                className="min-w-0 grow"
                                            />
                                        </label>

                                        {/* Section filter */}
                                        <select
                                            value={sectionFilter}
                                            onChange={(e) => setSectionFilter(e.target.value)}
                                            className="select select-bordered w-full bg-white sm:w-48"
                                        >
                                            <option value="All Sections">All Sections</option>
                                            {currentModule.sections.map((section) => (
                                                <option key={section} value={section}>
                                                    {section}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs text-slate-500">
                                            <th className="px-6 py-3 font-medium">Student</th>
                                            <th className="px-6 py-3 font-medium">Section</th>
                                            <th className="px-6 py-3 font-medium">Current Script</th>
                                            <th className="px-6 py-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedStudents.map((student) => {
                                            const status = STUDENT_STATUS_STYLES[student.status];
                                            return (
                                                <tr key={student.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                    <td className="px-6 py-3">
                                                        <p className="font-medium text-slate-700">{student.name}</p>
                                                        <p className="text-xs text-slate-400">{student.studentId}</p>
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-600">{student.section}</td>
                                                    <td className="px-6 py-3 text-slate-600">{student.currentScript}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`flex items-center gap-1.5 font-medium ${status.text}`}>
                                                            {status.live ? (
                                                                <span className="relative flex h-2 w-2 shrink-0">
                                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                                                </span>
                                                            ) : (
                                                                <i className={status.icon} />
                                                            )}
                                                            {student.status}
                                                        </span>
                                                        <p className="mt-0.5 text-xs text-slate-400">{student.lastActivity}</p>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {paginatedStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-6 text-center text-xs text-slate-400">
                                                    No students found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {filteredStudents.length > 0 && (
                                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row">
                                    <p className="text-xs text-slate-500">
                                        Showing {(currentPage - 1) * STUDENTS_PER_PAGE + 1}
                                        –{Math.min(currentPage * STUDENTS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} students
                                    </p>

                                    <div className="join">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="join-item btn btn-sm border-slate-200 bg-white text-slate-600 shadow-none hover:bg-slate-50 disabled:text-slate-300"
                                        >
                                            <i className="fa-solid fa-chevron-left"></i>
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => setCurrentPage(page)}
                                                className={`join-item btn btn-sm shadow-none ${
                                                    page === currentPage
                                                        ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="join-item btn btn-sm border-slate-200 bg-white text-slate-600 shadow-none hover:bg-slate-50 disabled:text-slate-300"
                                        >
                                            <i className="fa-solid fa-chevron-right"></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

            </div>

            {/* =====================================================
                ADD SCRIPT MODAL
            ====================================================== */}
            <dialog ref={addScriptModalRef} className="modal">
                <div className="modal-box max-w-md border-t-4 border-emerald-800">

                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-slate-800">Add Script</h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Create a reading script under a module
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeAddScriptModal}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    {/* Script Title */}
                    <div className="mb-4">
                        <label className="mb-2 block text-xs font-medium text-slate-500">Script Title</label>
                        <input
                            type="text"
                            value={scriptTitle}
                            onChange={(e) => setScriptTitle(e.target.value)}
                            placeholder="e.g. Reading Script 6"
                            className="input input-bordered w-full bg-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    {/* Module selector */}
                    <div className="mb-4">
                        <label className="mb-2 block text-xs font-medium text-slate-500">Module</label>
                        <select
                            value={scriptModuleId}
                            onChange={(e) => setScriptModuleId(Number(e.target.value))}
                            className="select select-bordered w-full bg-white focus:border-emerald-500 focus:outline-none"
                        >
                            {MODULES.map((module) => (
                                <option key={module.id} value={module.id}>
                                    {module.grade} · {module.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Due Date */}
                    <div className="mb-6">
                        <label className="mb-2 block text-xs font-medium text-slate-500">Due Date</label>
                        <input
                            type="date"
                            value={scriptDueDate}
                            onChange={(e) => setScriptDueDate(e.target.value)}
                            className="input input-bordered w-full bg-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeAddScriptModal}
                            className="btn btn-sm border-slate-200 bg-white text-slate-600 shadow-none hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleAddScript}
                            disabled={!scriptTitle || !scriptDueDate}
                            className="btn btn-sm border-emerald-600 bg-emerald-600 text-white shadow-sm hover:border-emerald-700 hover:bg-emerald-700 disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400"
                        >
                            <i className="fa-solid fa-check"></i>
                            Add Script
                        </button>
                    </div>

                </div>

                <form method="dialog" className="modal-backdrop">
                    <button onClick={closeAddScriptModal}>close</button>
                </form>
            </dialog>

        </div>
    );
}