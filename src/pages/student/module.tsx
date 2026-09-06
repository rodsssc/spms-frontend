import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "../../../@/components/ui/card";

/* =========================================================
   TYPES
========================================================= */

type ScriptStatus = "Complete" | "Pending" | "Not Inquired";

interface Script {
    id: number;
    title: string;
    status: ScriptStatus;
    dueDate: string;
}

interface ModuleData {
    id: number;
    title: string;
    description: string;
    scripts: Script[];
}

/* =========================================================
   MOCK DATA
   TODO: Replace with API data
========================================================= */

const MODULES: ModuleData[] = [
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
                dueDate: "Aug 20, 2026",
            },
            {
                id: 2,
                title: "Short Sentences",
                status: "Pending",
                dueDate: "Sep 05, 2026",
            },
            {
                id: 3,
                title: "Reading Passage",
                status: "Not Inquired",
                dueDate: "Sep 12, 2026",
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
                dueDate: "Aug 18, 2026",
            },
            {
                id: 2,
                title: "Word Matching",
                status: "Complete",
                dueDate: "Aug 25, 2026",
            },
            {
                id: 3,
                title: "Vocabulary Practice",
                status: "Pending",
                dueDate: "Sep 10, 2026",
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
                dueDate: "Aug 15, 2026",
            },
            {
                id: 2,
                title: "Question and Answer",
                status: "Pending",
                dueDate: "Sep 08, 2026",
            },
            {
                id: 3,
                title: "Reading Comprehension Exercise",
                status: "Not Inquired",
                dueDate: "Sep 15, 2026",
            },
        ],
    },
];

/* =========================================================
   SCRIPT STATUS STYLES
========================================================= */

const SCRIPT_STATUS_STYLES: Record<
    ScriptStatus,
    {
        icon: string;
        text: string;
        badge: string;
    }
> = {
    Complete: {
        icon: "fa-solid fa-circle-check",
        text: "text-emerald-600",
        badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },

    Pending: {
        icon: "fa-solid fa-clock",
        text: "text-amber-600",
        badge: "bg-amber-50 text-amber-700 border border-amber-200",
    },

    "Not Inquired": {
        icon: "fa-solid fa-circle",
        text: "text-slate-400",
        badge: "bg-slate-100 text-slate-500 border border-slate-200",
    },
};

/* =========================================================
   PAGE
========================================================= */

export default function Module() {

    const navigate = useNavigate();

    /* =====================================================
       OPEN MODULE STATE
    ====================================================== */

    const [openModule, setOpenModule] = useState<number | null>(1);

    const toggleModule = (moduleId: number) => {
        setOpenModule((current) =>
            current === moduleId ? null : moduleId
        );
    };

    const handleProceedToAssessment = (
        moduleId: number,
        scriptId: number
    ) => {
        navigate(`/student/assessment/${moduleId}/${scriptId}`);
    };

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-6">
            <div className="mx-auto w-full max-w-7xl">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div className="mb-4 sm:mb-6">
                    <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl lg:text-3xl">
                        My Modules
                    </h1>

                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        View your assigned modules, track script status, and
                        proceed to assessments.
                    </p>
                </div>

                {/* =====================================================
                    MODULES
                ====================================================== */}

                <Card className="gap-0 border-t-4 border-emerald-800 py-0 shadow-sm">

                    {/* Header */}
                    <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">

                        <h2 className="text-sm font-semibold text-slate-800 sm:text-base">
                            Assigned Modules
                        </h2>

                        <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
                            Expand a module to view its scripts and due
                            dates
                        </p>

                    </div>

                    {/* Module Accordion */}
                    <div className="divide-y divide-slate-200">

                        {MODULES.map((module) => {

                            const isOpen = openModule === module.id;

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
                                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 sm:gap-4 sm:px-6 sm:py-4"
                                    >

                                        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">

                                            {/* Icon */}
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 sm:h-10 sm:w-10">
                                                <i className="fa-solid fa-book text-sm text-emerald-700 sm:text-base" />
                                            </div>

                                            {/* Module Info */}
                                            <div className="min-w-0">

                                                <h3 className="truncate text-xs font-semibold text-slate-700 sm:text-sm">
                                                    {module.title}
                                                </h3>

                                                <p className="mt-0.5 hidden truncate text-xs text-slate-400 sm:block">
                                                    {module.description}
                                                </p>

                                            </div>

                                        </div>

                                        <div className="flex shrink-0 items-center gap-2 sm:gap-4">

                                            {/* Progress */}
                                            <div className="flex items-center gap-2 sm:block sm:text-right">

                                                {/* Mobile: compact pill */}
                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:hidden">
                                                    {progress}%
                                                </span>

                                                {/* Desktop: label + value */}
                                                <div className="hidden sm:block">
                                                    <p className="text-[10px] text-slate-400">
                                                        Progress
                                                    </p>

                                                    <p className="text-xs font-semibold text-emerald-700">
                                                        {progress}%
                                                    </p>
                                                </div>

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

                                    {/* Mobile-only description (shown under header) */}
                                    {!isOpen && (
                                        <p className="px-4 pb-2 -mt-1 truncate text-[11px] text-slate-400 sm:hidden">
                                            {module.description}
                                        </p>
                                    )}

                                    {/* =================================================
                                        SCRIPT LIST
                                    ================================================== */}

                                    {isOpen && (
                                        <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-3 sm:px-6">

                                            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">

                                                {module.scripts.map(
                                                    (script) => {

                                                        const status =
                                                            SCRIPT_STATUS_STYLES[
                                                                script.status
                                                            ];

                                                        const canProceed =
                                                            script.status !==
                                                            "Complete";

                                                        return (
                                                            <div
                                                                key={
                                                                    script.id
                                                                }
                                                                className="flex flex-col gap-2.5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4"
                                                            >

                                                                {/* Script Info */}
                                                                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">

                                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100">
                                                                        <i className="fa-solid fa-file-lines text-xs text-slate-500" />
                                                                    </div>

                                                                    <div className="min-w-0">

                                                                        <p className="truncate text-xs font-medium text-slate-600 sm:text-xs">
                                                                            {
                                                                                script.title
                                                                            }
                                                                        </p>

                                                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                                                            <i className="fa-regular fa-calendar mr-1" />
                                                                            Due{" "}
                                                                            {
                                                                                script.dueDate
                                                                            }
                                                                        </p>

                                                                    </div>

                                                                </div>

                                                                {/* Status + Action */}
                                                                <div className="flex flex-wrap items-center gap-2 pl-9 sm:flex-nowrap sm:pl-0">

                                                                    <span
                                                                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${status.badge}`}
                                                                    >

                                                                        <i
                                                                            className={
                                                                                status.icon
                                                                            }
                                                                        />

                                                                        {
                                                                            script.status
                                                                        }

                                                                    </span>

                                                                    {canProceed ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleProceedToAssessment(
                                                                                    module.id,
                                                                                    script.id
                                                                                )
                                                                            }
                                                                            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-800"
                                                                        >
                                                                            Proceed to Assessment
                                                                            <i className="fa-solid fa-arrow-right text-[10px]" />
                                                                        </button>
                                                                    ) : (
                                                                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                                                                            <i className="fa-solid fa-check text-[10px]" />
                                                                            Assessment Complete
                                                                        </span>
                                                                    )}

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