import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

type WordStatus = "pending" | "fluent" | "wrong";

interface AssessmentScript {
    id: number;
    moduleId: number;
    moduleTitle: string;
    title: string;
    instruction: string;
    passage: string;
}

/* =========================================================
   MOCK ASSESSMENT DATA
========================================================= */

const ASSESSMENT_SCRIPTS: AssessmentScript[] = [
    {
        id: 2,
        moduleId: 1,
        moduleTitle: "Module 1 - Reading Fluency",
        title: "Short Sentences",
        instruction:
            "Read the following passage aloud clearly and naturally.",
        passage:
            "The little boy walks to school every morning. He carries his books and greets his friends along the way.",
    },
    {
        id: 3,
        moduleId: 1,
        moduleTitle: "Module 1 - Reading Fluency",
        title: "Reading Passage",
        instruction:
            "Read the passage aloud. Try to maintain a steady reading pace.",
        passage:
            "Maria enjoys reading books after school. She visits the library every Friday and chooses a new story to read.",
    },
    {
        id: 3,
        moduleId: 2,
        moduleTitle: "Module 2 - Vocabulary Development",
        title: "Vocabulary Practice",
        instruction:
            "Read each sentence aloud and pronounce each word clearly.",
        passage:
            "The student learns new words every day. Practice helps improve reading and communication skills.",
    },
];

/* =========================================================
   PAGE
========================================================= */

export default function Assessment() {
    const navigate = useNavigate();

    const { moduleId, scriptId } = useParams();

    /* =====================================================
       FIND SELECTED SCRIPT
    ====================================================== */

    const script = useMemo(() => {
        return ASSESSMENT_SCRIPTS.find(
            (item) =>
                item.moduleId === Number(moduleId) &&
                item.id === Number(scriptId)
        );
    }, [moduleId, scriptId]);

    /* =====================================================
       RECORDING STATE
    ====================================================== */

    const [isRecording, setIsRecording] =
        useState(false);

    const [elapsedTime, setElapsedTime] =
        useState(0);

    const [recordingFinished, setRecordingFinished] =
        useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    /* =====================================================
       WORD STATE
    ====================================================== */

    const [currentWordIndex, setCurrentWordIndex] =
        useState(-1);

    const [wordStatuses, setWordStatuses] =
        useState<WordStatus[]>([]);

    /* =====================================================
       PREPARE WORDS
    ====================================================== */

    const words = useMemo(() => {
        if (!script) {
            return [];
        }

        return script.passage.split(/\s+/);
    }, [script]);

    /* =====================================================
       INITIALIZE WORD STATUS
    ====================================================== */

    useEffect(() => {
        setWordStatuses(
            words.map(() => "pending")
        );
    }, [words]);

    /* =====================================================
       TIMER
    ====================================================== */

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setElapsedTime(
                    (previous) => previous + 1
                );
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRecording]);

    /* =====================================================
       FORMAT TIMER
    ====================================================== */

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(
            seconds / 60
        );

        const remainingSeconds =
            seconds % 60;

        return `${String(minutes).padStart(
            2,
            "0"
        )}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    /* =====================================================
       START RECORDING
    ====================================================== */

    const startRecording = () => {
        setIsRecording(true);
        setRecordingFinished(false);
        setElapsedTime(0);

        setWordStatuses(
            words.map(() => "pending")
        );

        setCurrentWordIndex(-1);
    };

    /* =====================================================
       STOP RECORDING
    ====================================================== */

    const stopRecording = () => {
        setIsRecording(false);
        setRecordingFinished(true);

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        /*
         * MOCK RESULT
         *
         * Later this will be replaced with
         * the result returned by the speech
         * recognition / backend service.
         */

        setWordStatuses(
            words.map((_, index) => {
                return index % 5 === 3
                    ? "wrong"
                    : "fluent";
            })
        );

        setCurrentWordIndex(-1);
    };

    /* =====================================================
       MOCK WORD HIGHLIGHT
    ====================================================== */

    const simulateReading = () => {
        if (!isRecording) {
            return;
        }

        setCurrentWordIndex((current) => {
            const next = current + 1;

            if (next >= words.length) {
                return 0;
            }

            return next;
        });
    };

    /* =====================================================
       CALCULATE RESULT
    ====================================================== */

    const fluentWords =
        wordStatuses.filter(
            (status) => status === "fluent"
        ).length;

    const wrongWords =
        wordStatuses.filter(
            (status) => status === "wrong"
        ).length;

    const accuracy =
        words.length > 0
            ? Math.round(
                  (fluentWords /
                      words.length) *
                      100
              )
            : 0;

    /* =====================================================
       SCRIPT NOT FOUND
    ====================================================== */

    if (!script) {
        return (
            <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
                <div className="mx-auto max-w-3xl">

                    <Card className="border-t-4 border-red-600 shadow-sm">

                        <CardContent className="py-10 text-center">

                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                                <i className="fa-solid fa-circle-exclamation text-red-600" />
                            </div>

                            <h2 className="mt-4 text-lg font-semibold text-slate-800">
                                Assessment Not Found
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                The selected assessment could
                                not be found.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/student/module"
                                    )
                                }
                                className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                            >
                                Back to Modules
                            </button>

                        </CardContent>

                    </Card>

                </div>
            </div>
        );
    }

    /* =====================================================
       PAGE
    ====================================================== */

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-6">

            <div className="mx-auto w-full max-w-5xl">

                {/* =================================================
                    HEADER
                ================================================== */}

                <div className="mb-5">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/student/module"
                            )
                        }
                        className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-emerald-700"
                    >
                        <i className="fa-solid fa-arrow-left" />
                        Back to Modules
                    </button>

                    <p className="text-xs font-medium text-emerald-700">
                        {script.moduleTitle}
                    </p>

                    <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                        {script.title}
                    </h1>

                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        Reading Fluency Assessment
                    </p>

                </div>

                {/* =================================================
                    INSTRUCTIONS
                ================================================== */}

                <Card className="mb-4 border-t-4 border-emerald-800 shadow-sm">

                    <CardHeader>

                        <CardTitle className="text-sm text-slate-700">
                            <i className="fa-solid fa-circle-info mr-2 text-emerald-700" />
                            Instructions
                        </CardTitle>

                        <CardDescription className="text-xs leading-5">
                            {script.instruction}
                            Your voice will be recorded while
                            you read the passage.
                        </CardDescription>

                    </CardHeader>

                </Card>

                {/* =================================================
                    READING AREA
                ================================================== */}

                <Card className="shadow-sm">

                    <CardHeader className="border-b border-slate-100">

                        <div className="flex items-center justify-between gap-3">

                            <div>

                                <CardTitle className="text-sm text-slate-700">
                                    Reading Passage
                                </CardTitle>

                                <CardDescription className="mt-1 text-xs">
                                    Read each word clearly.
                                </CardDescription>

                            </div>

                            {/* TIMER */}

                            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">

                                <i
                                    className={`fa-solid fa-stopwatch ${
                                        isRecording
                                            ? "text-red-600"
                                            : "text-slate-500"
                                    }`}
                                />

                                <span className="font-mono text-sm font-semibold text-slate-700">
                                    {formatTime(
                                        elapsedTime
                                    )}
                                </span>

                            </div>

                        </div>

                    </CardHeader>

                    <CardContent className="py-6">

                        {/* =================================================
                            LEGEND
                        ================================================== */}

                        <div className="mb-5 flex flex-wrap gap-4 text-[11px]">

                            <div className="flex items-center gap-1.5">

                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                                <span className="text-slate-500">
                                    Fluent
                                </span>

                            </div>

                            <div className="flex items-center gap-1.5">

                                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

                                <span className="text-slate-500">
                                    Incorrect
                                </span>

                            </div>

                            <div className="flex items-center gap-1.5">

                                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />

                                <span className="text-slate-500">
                                    Not evaluated
                                </span>

                            </div>

                        </div>

                        {/* =================================================
                            PASSAGE
                        ================================================== */}

                        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-8">

                            <div className="text-lg font-medium leading-9 text-slate-700 sm:text-xl sm:leading-10">

                                {words.map(
                                    (
                                        word,
                                        index
                                    ) => {

                                        const status =
                                            wordStatuses[
                                                index
                                            ];

                                        const isCurrent =
                                            currentWordIndex ===
                                            index;

                                        let wordClass =
                                            "text-slate-700";

                                        if (
                                            status ===
                                            "fluent"
                                        ) {
                                            wordClass =
                                                "rounded bg-emerald-100 px-1 text-emerald-700";
                                        }

                                        if (
                                            status ===
                                            "wrong"
                                        ) {
                                            wordClass =
                                                "rounded bg-red-100 px-1 text-red-700";
                                        }

                                        if (
                                            isCurrent
                                        ) {
                                            wordClass =
                                                "rounded bg-amber-100 px-1 text-amber-700 ring-2 ring-amber-300";
                                        }

                                        return (
                                            <span
                                                key={
                                                    `${word}-${index}`
                                                }
                                                className={`${wordClass} mr-1.5 inline-block transition-all`}
                                            >
                                                {
                                                    word
                                                }
                                            </span>
                                        );
                                    }
                                )}

                            </div>

                        </div>

                        {/* =================================================
                            RECORDING CONTROLS
                        ================================================== */}

                        <div className="mt-6 flex flex-col items-center justify-center gap-3">

                            {!isRecording ? (
                                <button
                                    type="button"
                                    onClick={
                                        startRecording
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 sm:w-auto"
                                >
                                    <i className="fa-solid fa-microphone" />
                                    Start Recording
                                </button>
                            ) : (
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

                                    <button
                                        type="button"
                                        onClick={
                                            simulateReading
                                        }
                                        className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                                    >
                                        <i className="fa-solid fa-volume-high" />
                                        Simulate Reading
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            stopRecording
                                        }
                                        className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
                                    >
                                        <i className="fa-solid fa-stop" />
                                        Stop Recording
                                    </button>

                                </div>
                            )}

                            {isRecording && (
                                <div className="flex items-center gap-2 text-xs text-red-600">

                                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />

                                    Recording in progress...

                                </div>
                            )}

                        </div>

                    </CardContent>

                </Card>

                {/* =================================================
                    RESULT
                ================================================== */}

                {recordingFinished && (
                    <Card className="mt-4 border-t-4 border-emerald-800 shadow-sm">

                        <CardHeader>

                            <CardTitle className="text-sm text-slate-700">
                                Assessment Result
                            </CardTitle>

                            <CardDescription className="text-xs">
                                Your reading performance for this script.
                            </CardDescription>

                        </CardHeader>

                        <CardContent>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                                {/* ACCURACY */}

                                <div className="rounded-lg bg-emerald-50 p-4">

                                    <p className="text-xs text-slate-500">
                                        Accuracy
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-emerald-700">
                                        {accuracy}%
                                    </p>

                                </div>

                                {/* FLUENT */}

                                <div className="rounded-lg bg-emerald-50 p-4">

                                    <p className="text-xs text-slate-500">
                                        Fluent Words
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-emerald-700">
                                        {fluentWords}
                                    </p>

                                </div>

                                {/* WRONG */}

                                <div className="rounded-lg bg-red-50 p-4">

                                    <p className="text-xs text-slate-500">
                                        Incorrect Words
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-red-600">
                                        {wrongWords}
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/student/module"
                                    )
                                }
                                className="mt-5 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800"
                            >
                                Finish Assessment
                            </button>

                        </CardContent>

                    </Card>
                )}

            </div>
        </div>
    );
}