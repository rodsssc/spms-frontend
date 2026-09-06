import { useEffect, useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";

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

import { getStudent } from "../../services/student/auth.services";

/* =========================================================
   TYPES
========================================================= */

interface StatCard {
    label: string;
    value: string;
    subtext: string;
    icon: string;
}

interface ProgressPoint {
    month: string;
    progress: number;
}

interface StudentData {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    section_id: number;
    gender: string;
    birthdate: string;
    status: string;
}

type ScriptStatus = "Complete" | "Pending" | "Not Inquired";

interface Script {
    id: number;
    title: string;
    status: ScriptStatus;
}

interface Module {
    id: number;
    title: string;
    description: string;
    scripts: Script[];
}

/* =========================================================
   MOCK DATA
   TODO: Replace with API data
========================================================= */

const STAT_CARDS: StatCard[] = [
    {
        label: "Assigned Modules",
        value: "3",
        subtext: "Learning modules assigned",
        icon: "fa-solid fa-book-open",
    },
    {
        label: "Completed Scripts",
        value: "5",
        subtext: "Scripts completed",
        icon: "fa-solid fa-circle-check",
    },
    {
        label: "Pending Scripts",
        value: "3",
        subtext: "Scripts to complete",
        icon: "fa-solid fa-clock",
    },
    {
        label: "Overall Progress",
        value: "68%",
        subtext: "Across all modules",
        icon: "fa-solid fa-chart-line",
    },
];

const PROGRESS_TREND: ProgressPoint[] = [
    { month: "Mar", progress: 25 },
    { month: "Apr", progress: 34 },
    { month: "May", progress: 42 },
    { month: "Jun", progress: 51 },
    { month: "Jul", progress: 60 },
    { month: "Aug", progress: 68 },
];

const MODULES: Module[] = [
    {
        id: 1,
        title: "Module 1 - Reading Fluency",
        description:
            "Practice reading words, sentences, and short passages.",
        scripts: [
            {
                id: 1,
                title: "Basic Word Recognition",
                status: "Complete",
            },
            {
                id: 2,
                title: "Short Sentences",
                status: "Pending",
            },
            {
                id: 3,
                title: "Reading Passage",
                status: "Not Inquired",
            },
        ],
    },
    {
        id: 2,
        title: "Module 2 - Vocabulary Development",
        description:
            "Learn and practice commonly used vocabulary words.",
        scripts: [
            {
                id: 1,
                title: "Common Words",
                status: "Complete",
            },
            {
                id: 2,
                title: "Word Matching",
                status: "Complete",
            },
            {
                id: 3,
                title: "Vocabulary Practice",
                status: "Pending",
            },
        ],
    },
    {
        id: 3,
        title: "Module 3 - Reading Comprehension",
        description:
            "Develop your ability to understand and interpret written passages.",
        scripts: [
            {
                id: 1,
                title: "Story Reading",
                status: "Complete",
            },
            {
                id: 2,
                title: "Question and Answer",
                status: "Pending",
            },
            {
                id: 3,
                title: "Reading Comprehension Exercise",
                status: "Not Inquired",
            },
        ],
    },
];

/* =========================================================
   CHART CONFIG
========================================================= */

const progressChartConfig = {
    progress: {
        label: "Progress",
        color: "#059669",
    },
} satisfies ChartConfig;

/* =========================================================
   SCRIPT STATUS STYLES
========================================================= */

const SCRIPT_STATUS_STYLES: Record<
    ScriptStatus,
    {
        icon: string;
        text: string;
    }
> = {
    Complete: {
        icon: "fa-solid fa-circle-check",
        text: "text-emerald-600",
    },

    Pending: {
        icon: "fa-solid fa-clock",
        text: "text-amber-600",
    },

    "Not Inquired": {
        icon: "fa-solid fa-circle",
        text: "text-slate-400",
    },
};

/* =========================================================
   PAGE
========================================================= */

export default function Dashboard() {

    /* =====================================================
       STUDENT STATE
    ====================================================== */

    const [student, setStudent] = useState<StudentData | null>(null);
    const [isLoadingStudent, setIsLoadingStudent] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchStudent = async () => {
            try {
                const response = await getStudent();

                if (isMounted) {
                    setStudent(response.data.student);
                }
            } catch (error) {
                console.error("Failed to fetch student:", error);
            } finally {
                if (isMounted) {
                    setIsLoadingStudent(false);
                }
            }
        };

        fetchStudent();

        return () => {
            isMounted = false;
        };
    }, []);

    /* =====================================================
       OPEN MODULE STATE
    ====================================================== */

    const [openModule, setOpenModule] = useState<number | null>(1);

    const toggleModule = (moduleId: number) => {
        setOpenModule((current) =>
            current === moduleId ? null : moduleId
        );
    };

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2">
            <div className="mx-auto w-full max-w-7xl">

                {/* =====================================================
                    WELCOME
                ====================================================== */}

                <div className="mb-5">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                        {isLoadingStudent
                            ? "Welcome back..."
                            : `Welcome back, ${student?.first_name ?? "Student"}`}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Continue your learning journey and keep track of
                        your progress.
                    </p>
                </div>

                {/* =====================================================
                    STAT CARDS
                ====================================================== */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {STAT_CARDS.map((stat) => (
                        <Card
                            key={stat.label}
                            className="gap-2 border-t-4 border-emerald-800 py-4 shadow-sm"
                        >
                            <CardContent className="flex items-start justify-between px-5">

                                <div>
                                    <p className="text-xs font-medium text-slate-500">
                                        {stat.label}
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-slate-800">
                                        {stat.value}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {stat.subtext}
                                    </p>
                                </div>

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                                    <i
                                        className={`${stat.icon} text-emerald-700`}
                                    />
                                </div>

                            </CardContent>
                        </Card>
                    ))}

                </div>

                {/* =====================================================
                    PROGRESS + CONTINUE LEARNING
                ====================================================== */}

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">

                    {/* Progress Chart */}
                    <Card className="gap-4 border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5">

                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-slate-700">
                                My Learning Progress
                            </CardTitle>

                            <CardDescription className="text-xs">
                                Your overall learning progress over the last
                                6 months
                            </CardDescription>
                        </CardHeader>

                        <CardContent>

                            <ChartContainer
                                config={progressChartConfig}
                                className="h-72 w-full"
                            >
                                <AreaChart
                                    data={PROGRESS_TREND}
                                    margin={{
                                        top: 8,
                                        right: 16,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >

                                    <defs>
                                        <linearGradient
                                            id="fillProgress"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="var(--color-progress)"
                                                stopOpacity={0.35}
                                            />

                                            <stop
                                                offset="95%"
                                                stopColor="var(--color-progress)"
                                                stopOpacity={0.02}
                                            />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e2e8f0"
                                    />

                                    <XAxis dataKey="month" />

                                    <YAxis
                                        domain={[0, 100]}
                                        tickFormatter={(value) =>
                                            `${value}%`
                                        }
                                    />

                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                formatter={(value) =>
                                                    `${value}%`
                                                }
                                            />
                                        }
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="progress"
                                        stroke="var(--color-progress)"
                                        strokeWidth={2}
                                        fill="url(#fillProgress)"
                                    />

                                </AreaChart>
                            </ChartContainer>

                        </CardContent>

                    </Card>

                    {/* Continue Learning */}
                    <Card className="gap-4 border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5">

                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-slate-700">
                                Continue Learning
                            </CardTitle>

                            <CardDescription className="text-xs">
                                Pick up where you left off
                            </CardDescription>
                        </CardHeader>

                        <CardContent>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">

                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                                    <i className="fa-solid fa-book-open text-emerald-700" />
                                </div>

                                <p className="text-sm font-semibold text-slate-700">
                                    Reading Fluency
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Continue practicing your reading fluency
                                    skills.
                                </p>

                                <div className="mt-4">

                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="text-[11px] text-slate-400">
                                            Progress
                                        </span>

                                        <span className="text-xs font-semibold text-emerald-700">
                                            80%
                                        </span>
                                    </div>

                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className="h-full rounded-full bg-emerald-600"
                                            style={{ width: "80%" }}
                                        />
                                    </div>

                                </div>

                                <button
                                    type="button"
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
                                >
                                    Continue Module

                                    <i className="fa-solid fa-arrow-right text-[10px]" />
                                </button>

                            </div>

                        </CardContent>

                    </Card>

                </div>

                {/* =====================================================
                    MY MODULES
                ====================================================== */}

                <Card className="mt-5 gap-0 border-t-4 border-emerald-800 py-0 shadow-sm">

                    {/* Header */}
                    <div className="border-b border-slate-200 px-6 py-4">

                        <h2 className="text-base font-semibold text-slate-800">
                            My Modules
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-500">
                            View your assigned modules and learning scripts
                        </p>

                    </div>

                    {/* Module Accordion */}
                    <div className="divide-y divide-slate-200">

                        {MODULES.map((module) => {

                            const isOpen =
                                openModule === module.id;

                            const completedScripts =
                                module.scripts.filter(
                                    (script) =>
                                        script.status === "Complete"
                                ).length;

                            const progress = Math.round(
                                (completedScripts /
                                    module.scripts.length) *
                                    100
                            );

                            return (
                                <div key={module.id}>

                                    {/* =================================================
                                        MODULE HEADER
                                    ================================================== */}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleModule(module.id)
                                        }
                                        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50"
                                    >

                                        <div className="flex min-w-0 items-center gap-3">

                                            {/* Icon */}
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                                                <i className="fa-solid fa-book text-emerald-700" />
                                            </div>

                                            {/* Module Info */}
                                            <div className="min-w-0">

                                                <h3 className="text-sm font-semibold text-slate-700">
                                                    {module.title}
                                                </h3>

                                                <p className="mt-0.5 truncate text-xs text-slate-400">
                                                    {module.description}
                                                </p>

                                            </div>

                                        </div>

                                        <div className="flex shrink-0 items-center gap-4">

                                            {/* Progress */}
                                            <div className="hidden text-right sm:block">

                                                <p className="text-[10px] text-slate-400">
                                                    Progress
                                                </p>

                                                <p className="text-xs font-semibold text-emerald-700">
                                                    {progress}%
                                                </p>

                                            </div>

                                            {/* Arrow */}
                                            <i
                                                className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform duration-200 ${
                                                    isOpen
                                                        ? "rotate-180"
                                                        : ""
                                                }`}
                                            />

                                        </div>

                                    </button>

                                    {/* =================================================
                                        SCRIPT LIST
                                    ================================================== */}

                                    {isOpen && (
                                        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3">

                                            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">

                                                {module.scripts.map(
                                                    (script) => {

                                                        const status =
                                                            SCRIPT_STATUS_STYLES[
                                                                script.status
                                                            ];

                                                        return (
                                                            <div
                                                                key={
                                                                    script.id
                                                                }
                                                                className="flex items-center justify-between gap-4 px-4 py-3"
                                                            >

                                                                {/* Script */}
                                                                <div className="flex min-w-0 items-center gap-3">

                                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100">
                                                                        <i className="fa-solid fa-file-lines text-xs text-slate-500" />
                                                                    </div>

                                                                    <p className="truncate text-xs font-medium text-slate-600">
                                                                        {script.title}
                                                                    </p>

                                                                </div>

                                                                {/* Status */}
                                                                <div
                                                                    className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${status.text}`}
                                                                >

                                                                    <i
                                                                        className={
                                                                            status.icon
                                                                        }
                                                                    />

                                                                    <span className="hidden sm:inline">
                                                                        {
                                                                            script.status
                                                                        }
                                                                    </span>

                                                                </div>

                                                            </div>
                                                        );
                                                    }
                                                )}

                                            </div>

                                        </div>
                                    )}

                                </div>
                            );
                        })}

                    </div>

                </Card>

            </div>
        </div>
    );
}