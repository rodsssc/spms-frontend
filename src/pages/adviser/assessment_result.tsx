import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Cell, Pie, PieChart } from "recharts";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "../../../@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "../../../@/components/ui/card";

/* =========================================================
   TYPES
========================================================= */
type ErrorType = "mispronunciation" | "omission" | "substitution" | "insertion" | "self_correction" | "long_pause";

interface WordError {
    wordPosition: number;
    errorType: ErrorType;
}

interface Attempt {
    assessmentId: number;
    assessmentDate: string;
    audioFilePath: string;
    durationSeconds: number;
    wpm: number;
    accuracy: number;
    fluencyLevel: "Independent" | "Instructional" | "Frustration";
    remarks: string;
    wordErrors: WordError[];
}

/* =========================================================
   MOCK DATA (static)
   TODO: replace with real query on reading_assessments
   (student_id + reading_script_id) and assessment_word_errors.
========================================================= */
const STUDENT = {
    name: "Maria Santos",
    studentIdNumber: "STU-002",
    section: "Grade 3 - Rizal",
};

const SCRIPT = {
    title: "The Lost Kite",
    module: "Module 1",
    wordCount: 96,
    readingLevel: "Grade 3",
    content:
        "Ana loved flying her red kite every afternoon after school. One windy day, the string snapped and her kite drifted far into the sky. She ran across the field, chasing it as fast as she could, but the wind carried it over the tall trees near the river. Ana felt sad, but her friend Mico saw where it landed and climbed the tree to get it back. When he handed the kite to Ana, she smiled and thanked him. From then on, they always flew kites together, holding the string tightly so it would never fly away again.",
};

const ATTEMPTS: Attempt[] = [
    {
        assessmentId: 102,
        assessmentDate: "Aug 20, 2026",
        audioFilePath: "/audio/attempt-102.mp3",
        durationSeconds: 80,
        wpm: 72,
        accuracy: 89,
        fluencyLevel: "Instructional",
        remarks: "Improved pacing compared to last attempt. Still hesitates on multisyllabic words.",
        wordErrors: [
            { wordPosition: 6, errorType: "mispronunciation" },
            { wordPosition: 22, errorType: "omission" },
            { wordPosition: 41, errorType: "long_pause" },
            { wordPosition: 58, errorType: "substitution" },
            { wordPosition: 77, errorType: "self_correction" },
        ],
    },
    {
        assessmentId: 89,
        assessmentDate: "Aug 6, 2026",
        audioFilePath: "/audio/attempt-89.mp3",
        durationSeconds: 95,
        wpm: 61,
        accuracy: 81,
        fluencyLevel: "Instructional",
        remarks: "First attempt on this script. Frequent pauses at sentence breaks.",
        wordErrors: [
            { wordPosition: 3, errorType: "long_pause" },
            { wordPosition: 6, errorType: "mispronunciation" },
            { wordPosition: 22, errorType: "omission" },
            { wordPosition: 29, errorType: "substitution" },
            { wordPosition: 41, errorType: "long_pause" },
            { wordPosition: 49, errorType: "omission" },
            { wordPosition: 66, errorType: "mispronunciation" },
        ],
    },
];

/* =========================================================
   STYLES / COLORS (shared between transcript highlight + chart)
========================================================= */
const ERROR_STYLES: Record<ErrorType, { label: string; classes: string; hex: string }> = {
    mispronunciation: { label: "Mispronunciation", classes: "bg-red-100 text-red-700 decoration-red-400", hex: "#ef4444" },
    omission: { label: "Omission", classes: "bg-slate-200 text-slate-500 line-through decoration-slate-400", hex: "#94a3b8" },
    substitution: { label: "Substitution", classes: "bg-amber-100 text-amber-700 decoration-amber-400", hex: "#f59e0b" },
    insertion: { label: "Insertion", classes: "bg-sky-100 text-sky-700 decoration-sky-400", hex: "#0ea5e9" },
    self_correction: { label: "Self-correction", classes: "bg-emerald-100 text-emerald-700 decoration-emerald-400", hex: "#10b981" },
    long_pause: { label: "Long pause", classes: "bg-violet-100 text-violet-700 decoration-violet-400", hex: "#8b5cf6" },
};

const CORRECT_HEX = "#047857";

const FLUENCY_STYLES: Record<Attempt["fluencyLevel"], { icon: string; text: string; chip: string }> = {
    Independent: { icon: "fa-solid fa-circle-check", text: "text-emerald-600", chip: "bg-emerald-50" },
    Instructional: { icon: "fa-solid fa-triangle-exclamation", text: "text-amber-600", chip: "bg-amber-50" },
    Frustration: { icon: "fa-solid fa-circle-exclamation", text: "text-red-600", chip: "bg-red-50" },
};

/* =========================================================
   PAGE
========================================================= */
export default function AssessmentResult() {
    const navigate = useNavigate();
    const { assessmentId } = useParams();

    const initialIndex = Math.max(
        0,
        ATTEMPTS.findIndex((a) => String(a.assessmentId) === assessmentId)
    );
    const [activeIndex, setActiveIndex] = useState(initialIndex === -1 ? 0 : initialIndex);

    const attempt = ATTEMPTS[activeIndex];
    const status = FLUENCY_STYLES[attempt.fluencyLevel];
    const errorByPosition = new Map(attempt.wordErrors.map((e) => [e.wordPosition, e.errorType]));
    const usedErrorTypes = Array.from(new Set(attempt.wordErrors.map((e) => e.errorType)));

    // Word accuracy breakdown: correct words vs each error type count
    const correctWords = SCRIPT.wordCount - attempt.wordErrors.length;
    const errorCounts = usedErrorTypes.map((type) => ({
        name: ERROR_STYLES[type].label,
        value: attempt.wordErrors.filter((e) => e.errorType === type).length,
        color: ERROR_STYLES[type].hex,
    }));
    const pieData = [
        { name: "Correct", value: correctWords, color: CORRECT_HEX },
        ...errorCounts,
    ];

    const pieChartConfig = pieData.reduce((config, slice) => {
        config[slice.name] = { label: slice.name, color: slice.color };
        return config;
    }, {} as ChartConfig);

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2">
            <div className="mx-auto w-full max-w-7xl">

                {/* =====================================================
                    PAGE HEADER
                ====================================================== */}
                <div className="mb-5 rounded-xl border-t-4 border-emerald-800 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-emerald-700"
                            >
                                <i className="fa-solid fa-arrow-left"></i>
                                Back to Assessments
                            </button>

                            <h1 className="truncate text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                                {STUDENT.name}
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                                {STUDENT.studentIdNumber} · {STUDENT.section} · {SCRIPT.module} — {SCRIPT.title}
                            </p>
                        </div>

                        <span className={`flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.chip} ${status.text}`}>
                            <i className={status.icon}></i>
                            {attempt.fluencyLevel}
                        </span>
                    </div>
                </div>

                {/* =====================================================
                    ATTEMPT HISTORY TABS
                ====================================================== */}
                <div role="tablist" className="tabs tabs-boxed mb-5 w-fit bg-white shadow-sm">
                    {ATTEMPTS.map((a, index) => (
                        <a
                            key={a.assessmentId}
                            role="tab"
                            onClick={() => setActiveIndex(index)}
                            className={`tab gap-2 ${
                                index === activeIndex
                                    ? "tab-active !bg-emerald-600 !text-white"
                                    : "text-slate-500"
                            }`}
                        >
                            <i className="fa-solid fa-microphone text-xs"></i>
                            Attempt {ATTEMPTS.length - index} · {a.assessmentDate}
                        </a>
                    ))}
                </div>

                {/* =====================================================
                    2-COLUMN LAYOUT
                ====================================================== */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">

                    {/* =================================================
                        LEFT COLUMN — RECORDING / TRANSCRIPT / REMARKS
                    ================================================== */}
                    <div className="flex flex-col gap-4">

                        {/* Audio Recording */}
                        <Card className="border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold text-slate-700">
                                    <i className="fa-solid fa-microphone-lines mr-2 text-emerald-700"></i>
                                    Recording
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <audio controls className="w-full" src={attempt.audioFilePath}>
                                    Your browser does not support the audio element.
                                </audio>
                            </CardContent>
                        </Card>

                        {/* Transcript */}
                        <Card className="border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5">
                            <CardHeader>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <CardTitle className="text-sm font-semibold text-slate-700">
                                        <i className="fa-solid fa-file-lines mr-2 text-emerald-700"></i>
                                        Reading Script Transcript
                                    </CardTitle>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {usedErrorTypes.map((type) => (
                                            <span
                                                key={type}
                                                className={`rounded px-2 py-0.5 text-[11px] font-medium ${ERROR_STYLES[type].classes}`}
                                            >
                                                {ERROR_STYLES[type].label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-8 text-slate-700">
                                    {SCRIPT.content.split(" ").map((word, index) => {
                                        const position = index + 1;
                                        const errorType = errorByPosition.get(position);

                                        if (!errorType) {
                                            return <span key={position}>{word} </span>;
                                        }

                                        return (
                                            <span
                                                key={position}
                                                title={ERROR_STYLES[errorType].label}
                                                className={`rounded px-1 underline decoration-2 underline-offset-2 ${ERROR_STYLES[errorType].classes}`}
                                            >
                                                {word}{" "}
                                            </span>
                                        );
                                    })}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Remarks */}
                        <Card className="border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold text-slate-700">
                                    <i className="fa-solid fa-note-sticky mr-2 text-emerald-700"></i>
                                    Adviser Remarks
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600">{attempt.remarks}</p>
                            </CardContent>
                        </Card>

                    </div>

                    {/* =================================================
                        RIGHT COLUMN — STATS + STATUS CHART
                    ================================================== */}
                    <div className="flex flex-col gap-4">

                        {/* Stat cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="gap-1 border-t-4 border-emerald-800 py-3 shadow-sm">
                                <CardContent className="px-4">
                                    <p className="text-xs font-medium text-slate-500">Reading Speed</p>
                                    <p className="mt-1 text-xl font-bold text-slate-800">{attempt.wpm}</p>
                                    <p className="text-xs text-slate-400">WPM</p>
                                </CardContent>
                            </Card>

                            <Card className="gap-1 border-t-4 border-emerald-800 py-3 shadow-sm">
                                <CardContent className="px-4">
                                    <p className="text-xs font-medium text-slate-500">Accuracy</p>
                                    <p className="mt-1 text-xl font-bold text-slate-800">{attempt.accuracy}%</p>
                                    <p className="text-xs text-slate-400">{attempt.wordErrors.length} errors</p>
                                </CardContent>
                            </Card>

                            <Card className="col-span-2 gap-1 border-t-4 border-emerald-800 py-3 shadow-sm">
                                <CardContent className="flex items-center justify-between px-4">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Duration</p>
                                        <p className="mt-1 text-xl font-bold text-slate-800">
                                            {Math.floor(attempt.durationSeconds / 60)}:{String(attempt.durationSeconds % 60).padStart(2, "0")}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-slate-500">Script Length</p>
                                        <p className="mt-1 text-xl font-bold text-slate-800">{SCRIPT.wordCount}</p>
                                        <p className="text-xs text-slate-400">words</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Word Accuracy Breakdown — shadcn pie chart */}
                        <Card className="border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold text-slate-700">
                                    <i className="fa-solid fa-chart-pie mr-2 text-emerald-700"></i>
                                    Word Accuracy Breakdown
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="flex flex-col items-center">
                                <ChartContainer config={pieChartConfig} className="h-52 w-full">
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={48}
                                            outerRadius={78}
                                            strokeWidth={2}
                                        >
                                            {pieData.map((slice) => (
                                                <Cell key={slice.name} fill={slice.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>

                                <div className="mt-2 w-full space-y-1.5">
                                    {pieData.map((slice) => (
                                        <div key={slice.name} className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-1.5 text-slate-600">
                                                <span
                                                    className="h-2 w-2 rounded-full"
                                                    style={{ backgroundColor: slice.color }}
                                                />
                                                {slice.name}
                                            </span>
                                            <span className="font-semibold text-slate-700">{slice.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                </div>

            </div>
        </div>
    );
}