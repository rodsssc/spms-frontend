import { useState } from "react";
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
interface StatCard {
    label: string;
    value: string;
    subtext: string;
    icon: string;
}

interface InfoRow {
    label: string;
    value: string;
    icon: string;
}

interface ScorePoint {
    assessment: string;
    score: number;
}

type ItemStatus = "Completed" | "Pending" | "Non-Compliant";

interface ReadingScript {
    name: string;
    score: string;
    dateTaken: string;
    status: ItemStatus;
    notes: string;
}

interface Module {
    name: string;
    status: ItemStatus;
    scripts: ReadingScript[];
}

type TabKey = "overview" | "assessment";

/* =========================================================
   MOCK DATA (static)
   TODO: replace with real student record once the API is wired up.
========================================================= */
const OVERVIEW_STATS: StatCard[] = [
    { label: "Overall Status", value: "Proficient", subtext: "Above grade level", icon: "fa-solid fa-circle-check" },
    { label: "Module Completion", value: "67%", subtext: "2 of 3 scripts complete", icon: "fa-solid fa-gauge-high" },
    { label: "Average Score", value: "83%", subtext: "Across completed scripts", icon: "fa-solid fa-award" },
    { label: "Section", value: "Rizal", subtext: "Grade 3", icon: "fa-solid fa-chalkboard" },
];

const PERSONAL_INFO: InfoRow[] = [
    { label: "Full Name", value: "Juan Dela Cruz", icon: "fa-solid fa-user" },
    { label: "Student ID", value: "STU-001", icon: "fa-solid fa-id-badge" },
    { label: "Gender", value: "Male", icon: "fa-solid fa-venus-mars" },
    { label: "Age", value: "9 years old", icon: "fa-solid fa-cake-candles" },
    { label: "Guardian", value: "Elena Dela Cruz", icon: "fa-solid fa-people-roof" },
    { label: "Contact Number", value: "0917-123-4567", icon: "fa-solid fa-phone" },
    { label: "Address", value: "Purok 4, Brgy. Poblacion, Surigao City", icon: "fa-solid fa-location-dot" },
    { label: "Enrollment Date", value: "Jun 3, 2026", icon: "fa-solid fa-calendar-check" },
];

const SCORE_TREND: ScorePoint[] = [
    { assessment: "Script 1", score: 78 },
    { assessment: "Script 2", score: 88 },
    { assessment: "Script 3", score: 0 },
];

const MODULES: Module[] = [
    {
        name: "Module 1",
        status: "Pending",
        scripts: [
            {
                name: "Reading Script 1",
                score: "78%",
                dateTaken: "Aug 12, 2026",
                status: "Completed",
                notes: "Read 78 words per minute with 2 miscues. Comprehension check passed.",
            },
            {
                name: "Reading Script 2",
                score: "88%",
                dateTaken: "Aug 20, 2026",
                status: "Completed",
                notes: "Improved pacing and expression compared to Script 1. Comprehension check passed.",
            },
            {
                name: "Reading Script 3",
                score: "—",
                dateTaken: "Due Sep 5, 2026",
                status: "Non-Compliant",
                notes: "Deadline has passed without submission. Flag for follow-up with guardian.",
            },
        ],
    },
];

/* =========================================================
   CHART CONFIG
========================================================= */
const scoreChartConfig = {
    score: {
        label: "Score",
        color: "#059669",
    },
} satisfies ChartConfig;

/* =========================================================
   STATUS DISPLAY (Font Awesome only, no badges)
========================================================= */
const STATUS_STYLES: Record<ItemStatus, { icon: string; text: string }> = {
    Completed: { icon: "fa-solid fa-circle-check", text: "text-emerald-600" },
    Pending: { icon: "fa-solid fa-clock", text: "text-amber-600" },
    "Non-Compliant": { icon: "fa-solid fa-circle-exclamation", text: "text-red-600" },
};

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "fa-solid fa-chart-line" },
    { key: "assessment", label: "Assessment Results", icon: "fa-solid fa-clipboard-list" },
];

/* =========================================================
   PAGE
========================================================= */
export default function ViewStudent() {
    const [activeTab, setActiveTab] = useState<TabKey>("overview");

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2">
            <div className="mx-auto w-full max-w-7xl">

                {/* =====================================================
                    STUDENT HEADER
                ====================================================== */}
                <Card className="gap-0 border-t-4 border-emerald-800 py-0 shadow-sm">
                    <CardContent className="flex flex-col items-start justify-between gap-3 px-6 py-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                                <i className="fa-solid fa-user text-lg text-emerald-700" />
                            </div>
                            <div>
                                <h1 className="text-base font-semibold text-slate-800">Juan Dela Cruz</h1>
                                <p className="text-xs text-slate-500">STU-001 &middot; Grade 3 - Rizal</p>
                            </div>
                        </div>
                        <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                            <i className="fa-solid fa-circle-check" />
                            Proficient
                        </span>
                    </CardContent>
                </Card>

                {/* =====================================================
                    TABS (daisyUI)
                ====================================================== */}
                <div role="tablist" className="tabs tabs-lift mt-5">
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
                    TAB: OVERVIEW (stat cards + line graph + personal info)
                ====================================================== */}
                {activeTab === "overview" && (
                    <div className="mt-5 space-y-4">

                        {/* Stat cards */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {OVERVIEW_STATS.map((stat) => (
                                <Card
                                    key={stat.label}
                                    className="gap-2 border-t-4 border-emerald-800 py-4 shadow-sm"
                                >
                                    <CardContent className="flex items-start justify-between px-5">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                                            <p className="mt-1 text-2xl font-bold text-slate-800">{stat.value}</p>
                                            <p className="mt-1 text-xs text-slate-400">{stat.subtext}</p>
                                        </div>
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                                            <i className={`${stat.icon} text-emerald-700`} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Line graph + personal info */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">

                            <Card className="gap-4 border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5">
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold text-slate-700">
                                        Assessment Scores
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Score trend across reading scripts
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={scoreChartConfig} className="h-72 w-full">
                                        <LineChart data={SCORE_TREND} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="assessment" />
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
                                        Personal Information
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Profile and guardian details
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="divide-y divide-slate-100">
                                    {PERSONAL_INFO.map((info) => (
                                        <div key={info.label} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                                                <i className={`${info.icon} text-xs text-emerald-700`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-500">{info.label}</p>
                                                <p className="truncate text-sm font-medium text-slate-700">{info.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                )}

                {/* =====================================================
                    TAB: ASSESSMENT RESULTS
                    Module = dropdown, Reading Scripts = items inside it
                ====================================================== */}
                {activeTab === "assessment" && (
                    <Card className="mt-5 gap-0 border-t-4 border-emerald-800 py-0 shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <h2 className="text-base font-semibold text-slate-800">Assessment Results</h2>
                            <p className="text-xs text-slate-500">Reading scripts grouped by module</p>
                        </div>

                        <div className="space-y-3 px-4 py-4">
                            {MODULES.map((module, index) => {
                                const moduleStatus = STATUS_STYLES[module.status];
                                return (
                                    <div
                                        key={module.name}
                                        className="collapse collapse-arrow rounded-lg border border-slate-200 bg-white"
                                    >
                                        <input type="checkbox" defaultChecked={index === 0} />

                                        {/* Module row (dropdown trigger) */}
                                        <div className="collapse-title flex items-center gap-3 !pr-10 text-sm font-semibold text-slate-800">
                                            <span>{module.name}</span>
                                            <span className={`ml-auto flex items-center gap-1.5 text-xs font-medium ${moduleStatus.text}`}>
                                                <i className={moduleStatus.icon} />
                                                {module.status}
                                            </span>
                                        </div>

                                        {/* Reading scripts inside the module */}
                                        <div className="collapse-content">
                                            <div className="divide-y divide-slate-100 border-t border-slate-100 pt-1">
                                                {module.scripts.map((script) => {
                                                    const scriptStatus = STATUS_STYLES[script.status];
                                                    return (
                                                        <div key={script.name} className="flex flex-wrap items-start gap-x-4 gap-y-1 py-3">
                                                            <div className="min-w-[9rem]">
                                                                <p className="text-sm font-medium text-slate-700">{script.name}</p>
                                                                <p className="text-xs text-slate-400">{script.dateTaken}</p>
                                                            </div>
                                                            <span className="text-xs text-slate-500">{script.score}</span>
                                                            <span className={`flex items-center gap-1.5 text-xs font-medium ${scriptStatus.text}`}>
                                                                <i className={scriptStatus.icon} />
                                                                {script.status}
                                                            </span>
                                                            <p className="basis-full text-xs leading-relaxed text-slate-500">
                                                                {script.notes}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

            </div>
        </div>
    );
}