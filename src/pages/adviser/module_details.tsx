
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import Swal from "sweetalert2";

import {
    Card,
    CardContent,
} from "../../../@/components/ui/card";

import RadialProgress from "../../components/radial_progress";
import AssessmentResult from "./assessment_result";
import { getAssessments, type AdviserAssessment } from "../../services/adviser/assessment.services";
import { calculateStudentPerformance, getPerformanceBadgeClass, getPerformanceLevel } from "../../services/adviser/performance";

import {
    createReadingScript,
    deleteReadingScript,
    getAllModules,
    getAllReadingScripts,
    getModuleStudents,
    updateReadingScript,
    updateStudentScriptStatus,
    type Module,
    type ModuleStudent,
    type ReadingScript,
} from "../../services/adviser/module.services";

type TabKey =
    | "overview"
    | "scripts"
    | "students";

type ScriptStatus =
    | "pending"
    | "completed"
    | "non-compliant";

const countWords = (value: string) => {
    return value.trim()
        ? value.trim().split(/\s+/).length
        : 0;
};

export default function ModuleView() {
    const navigate = useNavigate();

    const {
        moduleId,
    } = useParams();

    const scriptModalRef =
        useRef<HTMLDialogElement>(null);

    const [module, setModule] =
        useState<Module | null>(null);

    const [scripts, setScripts] =
        useState<ReadingScript[]>([]);

    const [students, setStudents] =
        useState<ModuleStudent[]>([]);

    const [assessments, setAssessments] =
        useState<AdviserAssessment[]>([]);

    const [selectedAssessmentId, setSelectedAssessmentId] =
        useState<number | null>(null);

    const [activeTab, setActiveTab] =
        useState<TabKey>("overview");

    const [sectionId, setSectionId] =
        useState<number | undefined>();

    const [editingScript, setEditingScript] =
        useState<ReadingScript | null>(null);

    const [title, setTitle] =
        useState("");

    const [content, setContent] =
        useState("");

    const [dueDate, setDueDate] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [fetchProgress, setFetchProgress] =
        useState(0);

    const [error, setError] =
        useState("");

    const loadData = useCallback(
        async (
            selectedSectionId?: number,
        ) => {
            if (!moduleId) {
                return;
            }

            setLoading(true);
            setError("");

            try {
                const modules =
                    await getAllModules();

                const selectedModule =
                    modules.find(
                        (item) =>
                            item.id ===
                            Number(moduleId),
                    );

                if (!selectedModule) {
                    setError(
                        "Module not found.",
                    );

                    return;
                }

                setModule(selectedModule);

                const [
                    scriptData,
                    studentData,
                    assessmentData,
                ] = await Promise.all([
                    getAllReadingScripts(
                        selectedModule.id,
                    ),
                    getModuleStudents(
                        selectedModule.id,
                        selectedSectionId,
                    ),
                    getAssessments().catch(() => []),
                ]);

                setScripts(scriptData);
                setStudents(studentData);
                setAssessments(assessmentData);
            } catch {
                const message =
                    "Unable to load module details.";

                setError(message);

                await Swal.fire({
                    icon: "error",
                    title: "Unable to load module",
                    text: message,
                });
            } finally {
                setLoading(false);
            }
        },
        [moduleId],
    );

    useEffect(() => {
        void loadData(sectionId);
    }, [
        loadData,
        sectionId,
    ]);

    // Keep the same radial-progress behavior
    // used by the student and section screens
    // because the module APIs do not report
    // measurable fetch progress.
    useEffect(() => {
        if (!loading) {
            setFetchProgress(100);

            const reset = setTimeout(
                () => setFetchProgress(0),
                300,
            );

            return () =>
                clearTimeout(reset);
        }

        setFetchProgress(10);

        const interval = setInterval(
            () =>
                setFetchProgress(
                    (current) =>
                        current >= 90
                            ? 90
                            : current + 10,
                ),
            150,
        );

        return () =>
            clearInterval(interval);
    }, [loading]);

    const wordCount = useMemo(
        () => countWords(content),
        [content],
    );

    const activeStudents =
        students.filter(
            (student) =>
                student.status === "active",
        ).length;

    const moduleAssessments = useMemo(
        () => {
            const seen = new Set<number>();
            return assessments.filter((assessment) => {
                const score = Number(assessment.accuracy);
                if (assessment.module_id !== module?.id || assessment.status !== "completed" || !Number.isFinite(score) || score < 0 || score > 100 || seen.has(assessment.id)) return false;
                seen.add(assessment.id);
                return true;
            });
        },
        [assessments, module?.id],
    );

    const studentPerformanceById = useMemo(
        () => new Map(calculateStudentPerformance(moduleAssessments).map((performance) => [performance.studentId, performance])),
        [moduleAssessments],
    );

    const moduleCompletion = useMemo(() => {
        const completed = scripts.reduce((total, script) => total + students.filter((student) =>
            student.reading_scripts.find((assigned) => assigned.id === script.id)?.pivot.status === "completed"
        ).length, 0);
        const total = scripts.length * students.length;
        const averageScore = moduleAssessments.length
            ? Math.round(moduleAssessments.reduce((sum, assessment) => sum + Number(assessment.accuracy), 0) / moduleAssessments.length)
            : null;
        return { completed, total, averageScore };
    }, [scripts, students, moduleAssessments]);

    const scriptCompletionById = useMemo(() => new Map(scripts.map((script) => {
        const counts = { completed: 0, pending: 0, nonCompliant: 0, total: students.length };
        for (const student of students) {
            const status = student.reading_scripts.find((assigned) => assigned.id === script.id)?.pivot.status ?? "pending";
            if (status === "completed") counts.completed += 1;
            else if (status === "non-compliant") counts.nonCompliant += 1;
            else counts.pending += 1;
        }
        return [script.id, counts] as const;
    })), [scripts, students]);

    function openScriptModal(
        script?: ReadingScript,
    ) {
        setEditingScript(
            script ?? null,
        );

        setTitle(
            script?.title ?? "",
        );

        setContent(
            script?.content ?? "",
        );

        setDueDate(
            script?.due_date ?? "",
        );

        scriptModalRef.current?.showModal();
    }

    async function handleSaveScript() {
        if (
            !module ||
            !title ||
            wordCount === 0 ||
            wordCount > 250
        ) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            const data = {
                module_id: module.id,
                title,
                content,
                due_date:
                    dueDate ||
                    undefined,
            };

            if (editingScript) {
                const script =
                    await updateReadingScript(
                        editingScript.id,
                        data,
                    );

                setScripts(
                    (current) =>
                        current.map(
                            (item) =>
                                item.id ===
                                script.id
                                    ? script
                                    : item,
                        ),
                );
            } else {
                const script =
                    await createReadingScript(
                        data,
                    );

                setScripts(
                    (current) => [
                        ...current,
                        script,
                    ],
                );
            }

            scriptModalRef.current?.close();

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: editingScript
                    ? "Script updated"
                    : "Script added",
                showConfirmButton: false,
                timer: 1800,
            });
        } catch {
            const message =
                "Unable to save the reading script.";

            setError(message);

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Unable to save script",
                text: message,
                showConfirmButton: false,
                timer: 2500,
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteScript(
        script: ReadingScript,
    ) {
        const result =
            await Swal.fire({
                icon: "warning",
                title: "Delete this script?",
                text: `${script.title} will be permanently removed.`,
                showCancelButton: true,
                confirmButtonText: "Delete",
                confirmButtonColor: "#dc2626",
            });

        if (!result.isConfirmed) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            await deleteReadingScript(
                script.id,
            );

            setScripts(
                (current) =>
                    current.filter(
                        (item) =>
                            item.id !==
                            script.id,
                    ),
            );

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Script deleted",
                showConfirmButton: false,
                timer: 1800,
            });
        } catch {
            const message =
                "Unable to delete the reading script.";

            setError(message);

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Unable to delete script",
                text: message,
                showConfirmButton: false,
                timer: 2500,
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleStatusChange(
        scriptId: number,
        studentId: number,
        status: ScriptStatus,
    ) {
        setSaving(true);
        setError("");

        try {
            await updateStudentScriptStatus(
                scriptId,
                studentId,
                status,
            );

            setStudents(
                (current) =>
                    current.map(
                        (student) =>
                            student.id !==
                            studentId
                                ? student
                                : {
                                    ...student,

                                    reading_scripts:
                                        student.reading_scripts.map(
                                            (script) =>
                                                script.id ===
                                                scriptId
                                                    ? {
                                                        ...script,

                                                        pivot: {
                                                            ...script.pivot,
                                                            status,
                                                        },
                                                    }
                                                    : script,
                                        ),
                                },
                    ),
            );

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Script status updated",
                showConfirmButton: false,
                timer: 1500,
            });
        } catch {
            const message =
                "Unable to update the student script status.";

            setError(message);

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Unable to update status",
                text: message,
                showConfirmButton: false,
                timer: 2500,
            });
        } finally {
            setSaving(false);
        }
    }

    if (loading && !module) {
        return (
            <div className="flex min-h-80 items-center justify-center">
                <RadialProgress
                    value={fetchProgress}
                    size="lg"
                />
            </div>
        );
    }

    if (!module) {
        return (
            <div className="p-8">
                <p className="text-sm text-red-600">
                    {error || "Module not found."}
                </p>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/adviser/module",
                        )
                    }
                    className="btn btn-sm mt-4"
                >
                    Back to Modules
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-2">
            <div className="mx-auto max-w-7xl">

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/adviser/module",
                        )
                    }
                    className="mb-3 text-xs font-medium text-slate-500 hover:text-emerald-700"
                >
                    <i className="fa-solid fa-arrow-left mr-1" />
                    Back to Modules
                </button>

                <div className="rounded-xl border-t-4 border-emerald-800 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-xs text-slate-400">
                        {module.year_level}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">
                                {module.title}
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                {module.description ||
                                    "No description."}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                openScriptModal()
                            }
                            className="btn border-emerald-600 bg-emerald-600 text-white"
                        >
                            <i className="fa-solid fa-plus" />
                            Add Script
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="mt-3 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <div className="mt-5 flex gap-2 border-b border-slate-200">
                    {(
                        [
                            "overview",
                            "scripts",
                            "students",
                        ] as TabKey[]
                    ).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() =>
                                setActiveTab(tab)
                            }
                            className={`px-4 py-3 text-sm font-medium capitalize ${
                                activeTab === tab
                                    ? "border-b-2 border-emerald-600 text-emerald-700"
                                    : "text-slate-500"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex min-h-64 items-center justify-center">
                        <RadialProgress
                            value={fetchProgress}
                        />
                    </div>
                ) : (
                    <>
                        {activeTab === "overview" && (
                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                <Card className="border-t-4 border-emerald-800 shadow-sm"><CardContent className="px-5 py-4"><p className="text-xs font-medium text-slate-500">Reading Scripts</p><p className="mt-1 text-2xl font-bold text-slate-800">{scripts.length}</p><p className="mt-1 text-xs text-slate-400">Scripts in this module</p></CardContent></Card>
                                <Card className="border-t-4 border-emerald-800 shadow-sm"><CardContent className="px-5 py-4"><p className="text-xs font-medium text-slate-500">Students Assigned</p><p className="mt-1 text-2xl font-bold text-slate-800">{students.length}</p><p className="mt-1 text-xs text-slate-400">Across assigned sections</p></CardContent></Card>
                                <Card className="border-t-4 border-emerald-800 shadow-sm"><CardContent className="flex items-center justify-between gap-3 px-5 py-4"><div><p className="text-xs font-medium text-slate-500">Script Completions</p><p className="mt-1 text-2xl font-bold text-slate-800">{moduleCompletion.completed} <span className="text-base font-medium text-slate-400">/ {moduleCompletion.total}</span></p><p className="mt-1 text-xs text-slate-400">Completed student-script records</p></div><RadialProgress value={moduleCompletion.total ? Math.round((moduleCompletion.completed / moduleCompletion.total) * 100) : 0} size="sm" /></CardContent></Card>
                                <Card className="border-t-4 border-emerald-800 shadow-sm"><CardContent className="px-5 py-4"><p className="text-xs font-medium text-slate-500">Average Assessment Score</p><p className="mt-1 text-2xl font-bold text-slate-800">{moduleCompletion.averageScore === null ? "—" : `${moduleCompletion.averageScore}%`}</p><p className="mt-1 text-xs text-slate-400">Across {moduleAssessments.length} completed {moduleAssessments.length === 1 ? "result" : "results"} in this module</p></CardContent></Card>
                                <Card className="border-t-4 border-emerald-800 shadow-sm"><CardContent className="px-5 py-4"><p className="text-xs font-medium text-slate-500">Assigned Sections</p><p className="mt-1 text-2xl font-bold text-slate-800">{module.sections?.length ?? 0}</p><p className="mt-1 text-xs text-slate-400">Sections with this module</p></CardContent></Card>
                                <Card className="border-t-4 border-emerald-800 shadow-sm"><CardContent className="px-5 py-4"><p className="text-xs font-medium text-slate-500">Active Students</p><p className="mt-1 text-2xl font-bold text-slate-800">{activeStudents}</p><p className="mt-1 text-xs text-slate-400">Active students in assigned sections</p></CardContent></Card>
                            </div>
                        )}

                        {activeTab === "scripts" && (
                            <Card className="mt-5">
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[800px] text-left text-sm">
                                            <thead>
                                                <tr className="border-b text-slate-500">
                                                    <th className="px-5 py-3">
                                                        Title
                                                    </th>

                                                    <th className="px-5 py-3">
                                                        Words
                                                    </th>

                                                    <th className="px-5 py-3">
                                                        Due Date
                                                    </th>

                                                    <th className="px-5 py-3">
                                                        Students Completed
                                                    </th>

                                                    <th className="px-5 py-3">
                                                        Completion Status
                                                    </th>

                                                    <th className="w-16 px-5 py-3 text-center">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {scripts.map(
                                                    (script) => {
                                                        const completion = scriptCompletionById.get(script.id);
                                                        const scriptStatus = !completion || completion.total === 0
                                                            ? "No students"
                                                            : completion.completed === completion.total
                                                                ? "All complete"
                                                                : completion.nonCompliant > 0
                                                                    ? "Attention needed"
                                                                    : "In progress";
                                                        const scriptStatusClass = scriptStatus === "All complete"
                                                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                            : scriptStatus === "Attention needed"
                                                                ? "border-rose-200 bg-rose-50 text-rose-800"
                                                                : "border-amber-200 bg-amber-50 text-amber-800";
                                                        return (
                                                        <tr
                                                            key={script.id}
                                                            className="border-b last:border-0"
                                                        >
                                                            <td className="px-5 py-3 font-medium text-slate-700">
                                                                {script.title}
                                                            </td>

                                                            <td className="px-5 py-3 text-slate-600">
                                                                {
                                                                    script.word_count
                                                                }
                                                            </td>

                                                            <td className="px-5 py-3 text-slate-600">
                                                                {script.due_date ||
                                                                    "—"}
                                                            </td>

                                                            <td className="px-5 py-3">
                                                                <span className="font-semibold text-slate-700">{completion?.completed ?? 0} / {completion?.total ?? students.length}</span>
                                                                <p className="mt-0.5 text-xs text-slate-500">{completion?.pending ?? 0} pending · {completion?.nonCompliant ?? 0} non-compliant</p>
                                                            </td>

                                                            <td className="px-5 py-3">
                                                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${scriptStatusClass}`}>{scriptStatus}</span>
                                                            </td>

                                                            <td className="px-5 py-3 text-center">
                                                                <div className="dropdown dropdown-end">
                                                                    <button
                                                                        type="button"
                                                                        tabIndex={
                                                                            0
                                                                        }
                                                                        className="btn btn-ghost btn-sm btn-square"
                                                                    >
                                                                        <i className="fa-solid fa-ellipsis-vertical" />
                                                                    </button>

                                                                    <ul
                                                                        tabIndex={
                                                                            0
                                                                        }
                                                                        className="dropdown-content menu z-10 w-32 rounded-box bg-base-100 p-2 shadow"
                                                                    >
                                                                        <li>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    openScriptModal(
                                                                                        script,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <i className="fa-solid fa-pen w-4" />
                                                                                Edit
                                                                            </button>
                                                                        </li>

                                                                        <li>
                                                                            <button
                                                                                type="button"
                                                                                disabled={
                                                                                    saving
                                                                                }
                                                                                className="text-red-600 hover:bg-red-50"
                                                                                onClick={() =>
                                                                                    void handleDeleteScript(
                                                                                        script,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <i className="fa-solid fa-trash w-4" />
                                                                                Delete
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        );
                                                    },
                                                )}

                                                {scripts.length ===
                                                    0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={
                                                                6
                                                            }
                                                            className="px-5 py-8 text-center text-slate-500"
                                                        >
                                                            No reading scripts yet.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "students" && (
                            <Card className="mt-5">
                                <CardContent className="p-0">

                                    <div className="flex justify-end border-b p-4">
                                        <select
                                            value={
                                                sectionId ??
                                                ""
                                            }
                                            onChange={(event) =>
                                                setSectionId(
                                                    event.target
                                                        .value
                                                        ? Number(
                                                            event.target
                                                                .value,
                                                        )
                                                        : undefined,
                                                )
                                            }
                                            className="select select-bordered select-sm bg-white"
                                        >
                                            <option value="">
                                                All assigned sections
                                            </option>

                                            {module.sections?.map(
                                                (section) => (
                                                    <option
                                                        key={
                                                            section.id
                                                        }
                                                        value={
                                                            section.id
                                                        }
                                                    >
                                                        {
                                                            section.section_name
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b text-slate-500">
                                                    <th className="px-5 py-3">
                                                        Student
                                                    </th>

                                                    <th className="px-5 py-3">
                                                        Section
                                                    </th>

                                                    <th className="px-5 py-3">
                                                        Module Progress
                                                    </th>

                                                    <th className="px-5 py-3">
                                                        Reading Scripts & Results
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {students.map(
                                                    (student) => {
                                                        const performance = studentPerformanceById.get(student.id);
                                                        const needsImprovement = performance?.performanceLevel === "Needs Improvement";
                                                        const completedScripts = scripts.filter((script) => student.reading_scripts.find((assigned) => assigned.id === script.id)?.pivot.status === "completed").length;
                                                        const allScriptsComplete = scripts.length > 0 && completedScripts === scripts.length;
                                                        const hasNonCompliant = scripts.some((script) => student.reading_scripts.find((assigned) => assigned.id === script.id)?.pivot.status === "non-compliant");
                                                        return (
                                                        <tr
                                                            key={
                                                                student.id
                                                            }
                                                            className={`border-b align-top last:border-0 ${needsImprovement ? "border-l-4 border-l-rose-500 bg-rose-50/40" : ""}`}
                                                        >
                                                            <td className="px-5 py-3 font-medium text-slate-700">
                                                                {
                                                                    student.first_name
                                                                }{" "}
                                                                {
                                                                    student.last_name
                                                                }

                                                                <p className="text-xs font-normal text-slate-400">
                                                                    {
                                                                        student.student_code
                                                                    }
                                                                </p>
                                                                {performance && <><span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getPerformanceBadgeClass(performance.performanceLevel)}`}>{performance.averageAccuracy}% · {performance.performanceLevel}</span><span className="mt-1 block text-[11px] font-normal text-slate-500">{performance.assessmentCount} scored {performance.assessmentCount === 1 ? "script" : "scripts"}</span></>}
                                                                {needsImprovement && <p className="mt-1 text-xs font-medium text-rose-700"><i className="fa-solid fa-triangle-exclamation mr-1" />Follow-up recommended</p>}
                                                            </td>

                                                            <td className="px-5 py-3 text-slate-600">
                                                                {student
                                                                    .section
                                                                    ?.section_name ||
                                                                    "—"}
                                                            </td>

                                                            <td className="px-5 py-3">
                                                                {scripts.length === 0 ? <span className="text-xs text-slate-400">No scripts</span> : <><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${allScriptsComplete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : hasNonCompliant ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{allScriptsComplete ? "All complete" : hasNonCompliant ? "Needs attention" : "Incomplete"}</span><p className="mt-1 text-xs text-slate-500">{completedScripts} of {scripts.length} scripts completed</p></>}
                                                            </td>

                                                            <td className="space-y-2 px-5 py-3">
                                                                {scripts.map(
                                                                    (
                                                                        script,
                                                                    ) => {
                                                                        const assigned =
                                                                            student.reading_scripts.find(
                                                                                (
                                                                                    item,
                                                                                ) =>
                                                                                    item.id ===
                                                                                    script.id,
                                                                            );

                                                                        const status =
                                                                            assigned
                                                                                ?.pivot
                                                                                .status ??
                                                                            "pending";

                                                                        const result =
                                                                            assessments.find(
                                                                                (item) =>
                                                                                    item.student_id === student.id &&
                                                                                    item.module_id === module.id &&
                                                                                    item.script_title === script.title,
                                                                            );

                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    script.id
                                                                                }
                                                                                className="flex flex-wrap items-center gap-2"
                                                                            >
                                                                                <span className="min-w-40 text-slate-700">
                                                                                    {
                                                                                        script.title
                                                                                    }
                                                                                </span>

                                                                                <select
                                                                                    value={
                                                                                        status
                                                                                    }
                                                                                    disabled={
                                                                                        saving
                                                                                    }
                                                                                    onChange={(
                                                                                        event,
                                                                                    ) =>
                                                                                        void handleStatusChange(
                                                                                            script.id,
                                                                                            student.id,
                                                                                            event
                                                                                                .target
                                                                                                .value as ScriptStatus,
                                                                                        )
                                                                                    }
                                                                                    className="select select-bordered select-xs capitalize"
                                                                                >
                                                                                    <option value="pending">
                                                                                        Pending
                                                                                    </option>

                                                                                    <option value="completed">
                                                                                        Completed
                                                                                    </option>

                                                                                    <option value="non-compliant">
                                                                                        Non-Compliant
                                                                                    </option>
                                                                                </select>
                                                                                {result && <><span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getPerformanceBadgeClass(getPerformanceLevel(result.accuracy))}`}>{result.accuracy}% · {getPerformanceLevel(result.accuracy)}</span><button type="button" onClick={() => setSelectedAssessmentId(result.id)} className="rounded-md border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">View result</button></>}
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                            </td>
                                                        </tr>
                                                        );
                                                    },
                                                )}

                                                {students.length ===
                                                    0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={
                                                                4
                                                            }
                                                            className="px-5 py-8 text-center text-slate-500"
                                                        >
                                                            No students in the selected section.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

            </div>

            <dialog
                ref={scriptModalRef}
                className="modal"
            >
                <div className="modal-box max-w-xl border-t-4 border-emerald-800">

                    <h3 className="text-lg font-bold text-slate-800">
                        {editingScript
                            ? "Edit Reading Script"
                            : "Add Reading Script"}
                    </h3>

                    <div className="mt-4 space-y-3">

                        <input
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value,
                                )
                            }
                            placeholder="Script title"
                            className="input input-bordered w-full"
                        />

                        <textarea
                            value={content}
                            onChange={(event) =>
                                setContent(
                                    event.target.value,
                                )
                            }
                            placeholder="Reading content"
                            className="textarea textarea-bordered min-h-48 w-full"
                        />

                        <p
                            className={`text-xs ${
                                wordCount > 250
                                    ? "text-red-600"
                                    : "text-slate-500"
                            }`}
                        >
                            {wordCount} / 250 words
                        </p>

                        <input
                            type="date"
                            value={dueDate}
                            onChange={(event) =>
                                setDueDate(
                                    event.target.value,
                                )
                            }
                            className="input input-bordered w-full"
                        />

                    </div>

                    <div className="mt-6 flex justify-end gap-2">

                        <button
                            type="button"
                            onClick={() =>
                                scriptModalRef.current?.close()
                            }
                            className="btn btn-sm"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            disabled={
                                !title ||
                                wordCount === 0 ||
                                wordCount > 250 ||
                                saving
                            }
                            onClick={() =>
                                void handleSaveScript()
                            }
                            className="btn btn-sm border-emerald-600 bg-emerald-600 text-white"
                        >
                            {saving
                                ? "Saving..."
                                : editingScript
                                    ? "Save Changes"
                                    : "Add Script"}
                        </button>

                    </div>

                </div>

                <form
                    method="dialog"
                    className="modal-backdrop"
                >
                    <button>
                        close
                    </button>
                </form>
            </dialog>

            {selectedAssessmentId !== null && <AssessmentResult assessmentId={selectedAssessmentId} onClose={() => setSelectedAssessmentId(null)} />}

        </div>
    );
}

