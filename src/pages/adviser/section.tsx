import { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import Loading from "../../components/loading";
import RadialProgress from "../../components/radial_progress";
import { createSection, getAllSections } from "../../services/adviser/section.services";
import type { Sections, SectionFilters } from "../../services/adviser/section.services";
import { getSectionsWithStudents } from "../../services/adviser/student.services";
import type { Students } from "../../services/adviser/student.services";
import { getAllModules, getAllReadingScripts, getModuleStudents } from "../../services/adviser/module.services";
import { getAssessments } from "../../services/adviser/assessment.services";
import { calculateStudentPerformance, getPerformanceBadgeClass, type StudentPerformance } from "../../services/adviser/performance";

const GRADE_LEVELS = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

interface SectionStudentProgress {
    completedScripts: number;
    totalScripts: number;
    performance?: StudentPerformance;
}

export default function Section() {
    const addModalRef = useRef<HTMLDialogElement>(null);
    const viewModalRef = useRef<HTMLDialogElement>(null);

    const [sections, setSections] = useState<Sections[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Save-Section button spinner
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Drives the RadialProgress shown while the section grid is fetching.
    // Animates toward 90% and only reaches 100% once the request resolves.
    const [fetchProgress, setFetchProgress] = useState<number>(0);

    const [sectionName, setSectionName] = useState<string>("");
    const [yearLevel, setYearLevel] = useState<string>("");
    const [adviserName, setAdviserName] = useState<string>("");
    const [status, setStatus] = useState<"active" | "inactive">("active");
    const [schoolYear, setSchoolYear] = useState<string>("2026-2027");

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filterYearLevel, setFilterYearLevel] = useState<string>("all");

    const [selectedSection, setSelectedSection] = useState<Sections | null>(null);
    const [studentSearch, setStudentSearch] = useState<string>("");

    // Students for the section currently open in the View modal
    // (top 5 per section, from SectionController@display_student)
    const [viewStudents, setViewStudents] = useState<Students[]>([]);
    const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
    const [studentFetchProgress, setStudentFetchProgress] = useState<number>(0);
    const [studentProgress, setStudentProgress] = useState<Map<number, SectionStudentProgress>>(new Map());
    const [progressLoading, setProgressLoading] = useState<boolean>(false);
    const [progressError, setProgressError] = useState(false);

    useEffect(() => {
        fetchSections();
    }, []);

    // Animate the radial progress while the section grid is fetching
    useEffect(() => {
        if (!loading) {
            setFetchProgress(100);
            const reset = setTimeout(() => setFetchProgress(0), 300);
            return () => clearTimeout(reset);
        }

        setFetchProgress(10);
        const interval = setInterval(() => {
            setFetchProgress((prev) => (prev >= 90 ? 90 : prev + 10));
        }, 150);

        return () => clearInterval(interval);
    }, [loading]);

    // Same animation, for the View modal's student list
    useEffect(() => {
        if (!studentsLoading) {
            setStudentFetchProgress(100);
            const reset = setTimeout(() => setStudentFetchProgress(0), 300);
            return () => clearTimeout(reset);
        }

        setStudentFetchProgress(10);
        const interval = setInterval(() => {
            setStudentFetchProgress((prev) => (prev >= 90 ? 90 : prev + 10));
        }, 150);

        return () => clearInterval(interval);
    }, [studentsLoading]);

    const fetchSections = async (filters?: SectionFilters) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllSections(filters);
            setSections(data);
        } catch (err: any) {
            console.log(err);
            const message = err.response?.data?.message || "Failed to fetch sections. Please try again later.";
            setError(message);
            await Swal.fire({
                icon: "error",
                title: "Unable to load sections",
                text: message,
            });
        } finally {
            setLoading(false);
        }
    };

    // The endpoint returns every one of the adviser's sections with up to
    // 5 students nested in — so we fetch it, then pull out just the section
    // currently open in the modal.
    const fetchSectionStudents = async (sectionId: number, search?: string) => {
        try {
            setStudentsLoading(true);
            const data = await getSectionsWithStudents({ search: search || undefined });
            const match = data.find((s) => s.id === sectionId);
            setViewStudents(match?.students ?? []);
        } catch (err: any) {
            console.log(err);
            await Swal.fire({
                icon: "error",
                title: "Unable to load students",
                text: err.response?.data?.message || "Failed to fetch students for this section.",
            });
        } finally {
            setStudentsLoading(false);
        }
    };

    const fetchSectionProgress = async (sectionId: number) => {
        try {
            setProgressLoading(true);
            setProgressError(false);
            const [modules, assessments] = await Promise.all([getAllModules(), getAssessments()]);
            const assignedModules = modules.filter((module) => module.sections?.some((section) => section.id === sectionId));
            const moduleData = await Promise.all(assignedModules.map(async (module) => {
                const [scripts, moduleStudents] = await Promise.all([
                    getAllReadingScripts(module.id),
                    getModuleStudents(module.id, sectionId),
                ]);
                return { moduleId: module.id, scripts, students: moduleStudents };
            }));

            const progress = new Map<number, SectionStudentProgress>();
            for (const item of moduleData) {
                for (const student of item.students) {
                    const current = progress.get(student.id) ?? { completedScripts: 0, totalScripts: 0 };
                    current.totalScripts += item.scripts.length;
                    current.completedScripts += item.scripts.filter((script) =>
                        student.reading_scripts.find((assigned) => assigned.id === script.id)?.pivot.status === "completed"
                    ).length;
                    progress.set(student.id, current);
                }
            }

            const moduleIds = new Set(assignedModules.map((module) => module.id));
            const performanceByStudent = calculateStudentPerformance(assessments.filter((assessment) => moduleIds.has(assessment.module_id)));
            performanceByStudent.forEach((performance) => {
                const current = progress.get(performance.studentId) ?? { completedScripts: 0, totalScripts: 0 };
                current.performance = performance;
                progress.set(performance.studentId, current);
            });
            setStudentProgress(progress);
        } catch (err: any) {
            console.error(err);
            setProgressError(true);
            await Swal.fire({ icon: "error", title: "Unable to load student progress", text: "Please try again later." });
        } finally {
            setProgressLoading(false);
        }
    };

    const handleSearch = () => {
        fetchSections({
            search: searchTerm || undefined,
            year_level: filterYearLevel,
        });
    };

    const handleStudentSearch = () => {
        if (!selectedSection) return;
        fetchSectionStudents(selectedSection.id, studentSearch);
    };

    const handleAddSection = async () => {
        try {
            setSubmitting(true);
            setError(null);

            const data = {
                section_name: sectionName,
                year_level: yearLevel,
                adviser_name: adviserName,
                school_year: schoolYear,
                status: status,
            };

            await createSection(data);

            // Reset form
            setSectionName("");
            setYearLevel("");
            setAdviserName("");
            setSchoolYear("2026-2027");
            setStatus("active");

            addModalRef.current?.close();

            // Refresh sections
            await fetchSections();

            // Success alert
            await Swal.fire({
                toast: true,
                icon: "success",
                title: "Section Added!",
                position: "top-end",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
                width: "320px",
            });

        } catch (err: any) {
            await Swal.fire({
                toast: true,
                icon: "error",
                title: "Failed to Add Section",
                text:
                    err.response?.data?.message ||
                    "Something went wrong while adding the section.",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
                width: "320px",
                position: "top-end",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const openViewModal = (section: Sections) => {
        setSelectedSection(section);
        setStudentSearch("");
        setViewStudents([]);
        setStudentProgress(new Map());
        setProgressError(false);
        viewModalRef.current?.showModal();
        fetchSectionStudents(section.id);
        fetchSectionProgress(section.id);
    };

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2">
            <div className="mx-auto w-full max-w-7xl">
                {/* Page Header */}
                <div className="mb-5 rounded-xl border-t-4 border-emerald-800 bg-white shadow-sm p-4 sm:p-5">

                    {/* Title Section */}
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                                Section Management
                            </h1>
                            <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">
                                Manage class sections and student assignments
                            </p>
                        </div>

                    </div>

                    {/* Search / Filter Toolbar */}
                    <div className="flex w-full flex-col gap-2 sm:flex-row">
                        <div className="min-w-0 flex-1">
                            <label className="input input-bordered flex w-full items-center gap-2 bg-slate-50 focus-within:border-emerald-500 focus-within:outline-none">
                                <i className="fa-solid fa-magnifying-glass shrink-0 text-sm text-slate-400"></i>
                                <input
                                    type="text"
                                    placeholder="Search section or adviser..."
                                    className="min-w-0 grow"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </label>
                        </div>

                        <select
                            className="select select-bordered w-full bg-white sm:w-36 md:w-40"
                            value={filterYearLevel}
                            onChange={(e) => {
                                setFilterYearLevel(e.target.value);
                                fetchSections({ search: searchTerm || undefined, year_level: e.target.value });
                            }}
                        >
                            <option value="all">All Year Levels</option>
                            {GRADE_LEVELS.map((grade) => (
                                <option key={grade} value={grade}>{grade}</option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={loading}
                            className="btn shrink-0 border-emerald-600 bg-emerald-600 text-white shadow-sm hover:border-emerald-700 hover:bg-emerald-700 disabled:opacity-70"
                        >
                            {loading ? (
                                <Loading size="xs" className="!text-white" />
                            ) : (
                                <i className="fa-solid fa-magnifying-glass"></i>
                            )}
                            <span className="sm:inline">Search</span>
                        </button>
                    </div>
                </div>

                {/* Sections Grid */}
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {loading && (
                        <div className="col-span-full flex flex-col items-center justify-center gap-2 py-10">
                            <RadialProgress
                                value={fetchProgress}
                                size="md"
                                tone="emerald"
                                showValue={false}
                            />
                            <p className="text-xs text-slate-400">Loading sections...</p>
                        </div>
                    )}

                    {!loading && !error && sections.length === 0 && (
                        <p className="col-span-full text-sm text-slate-500">No sections found.</p>
                    )}

                    {!loading && sections.map((section) => (
                        <div
                            key={section.id}
                            className="w-full rounded-xl border-t-2 border-emerald-800 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-400">
                                            {section.year_level}
                                        </p>
                                        <h2 className="mt-0.5 truncate text-lg font-bold text-slate-800">
                                            {section.section_name}
                                        </h2>
                                    </div>

                                    <button
                                        type="button"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                                        title="View Section"
                                        onClick={() => openViewModal(section)}
                                    >
                                        <i className="fa-solid fa-eye"></i>
                                    </button>
                                </div>

                                <div className="my-3 border-t border-slate-100"></div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-400">Adviser</p>
                                        <p className="truncate text-sm font-medium text-slate-700">
                                            {section.adviser_name}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-400">School Year</p>
                                        <p className="text-sm font-medium text-slate-700">
                                            {section.school_year}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-400">Status</p>

                                        <span
                                            className={`text-xs font-semibold capitalize ${
                                                section.status === "active"
                                                    ? "text-emerald-600"
                                                    : "text-slate-400"
                                            }`}
                                        >
                                            {section.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Section Modal */}
            <dialog ref={addModalRef} className="modal">
                <div className="modal-box w-11/12 max-w-lg border-t-5 border-emerald-800 bg-white shadow-sm">

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Add Section</h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Create a new class section for the school year.
                            </p>
                        </div>

                        <form method="dialog">
                            <button type="submit" className="btn btn-circle btn-ghost btn-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Close">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </form>
                    </div>

                    <div className="mt-5 space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                    Grade Level<span className="ml-0.5 text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={yearLevel}
                                    onChange={(e) => setYearLevel(e.target.value)}
                                    className="select select-bordered select-sm w-full focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="" disabled>Select grade</option>
                                    {GRADE_LEVELS.map((grade) => (
                                        <option key={grade} value={grade}>{grade}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                    School Year<span className="ml-0.5 text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={schoolYear}
                                    onChange={(e) => setSchoolYear(e.target.value)}
                                    className="select select-bordered select-sm w-full focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="2026-2027">2026–2027</option>
                                    <option value="2027-2028">2027–2028</option>
                                    <option value="2028-2029">2028–2029</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Section Name<span className="ml-0.5 text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={sectionName}
                                onChange={(e) => setSectionName(e.target.value)}
                                placeholder="e.g. Rizal"
                                className="input input-bordered input-sm w-full focus:border-emerald-500 focus:outline-none"
                            />
                            <p className="mt-1 text-[11px] text-slate-400">
                                Enter the name of the class section.
                            </p>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Adviser Name<span className="ml-0.5 text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={adviserName}
                                onChange={(e) => setAdviserName(e.target.value)}
                                placeholder="e.g. Juan Dela Cruz"
                                className="input input-bordered input-sm w-full focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="modal-action mt-5">
                        <form method="dialog">
                            <button type="submit" disabled={submitting} className="btn btn-sm">Cancel</button>
                        </form>

                        <button
                            type="button"
                            onClick={handleAddSection}
                            disabled={submitting}
                            className="btn btn-sm border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700 disabled:opacity-70"
                        >
                            {submitting ? (
                                <Loading size="xs" className="!text-white" />
                            ) : (
                                <i className="fa-solid fa-floppy-disk"></i>
                            )}
                            {submitting ? "Saving..." : "Save Section"}
                        </button>
                    </div>
                </div>

                <form method="dialog" className="modal-backdrop">
                    <button type="submit">close</button>
                </form>
            </dialog>

            {/* View Section Modal */}
            <dialog ref={viewModalRef} className="modal">
                <div className="modal-box w-11/12 max-w-4xl border-t-4 border-emerald-800 bg-white p-0 shadow-xl">

                    <div className="border-b border-slate-200 px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                                    {selectedSection?.year_level}
                                </p>
                                <h3 className="mt-0.5 text-xl font-bold text-slate-800">
                                    {selectedSection?.section_name}
                                </h3>
                            </div>

                            <form method="dialog">
                                <button type="submit" className="btn btn-circle btn-ghost btn-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Close">
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </form>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
                            <div>
                                <p className="text-[11px] text-slate-400">Adviser</p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                    {selectedSection?.adviser_name}
                                </p>
                            </div>

                            <div className="hidden h-7 w-px bg-slate-200 sm:block"></div>

                            <div>
                                <p className="text-[11px] text-slate-400">School Year</p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                    {selectedSection?.school_year}
                                </p>
                            </div>

                            <div className="hidden h-7 w-px bg-slate-200 sm:block"></div>

                            <div>
                                <p className="text-[11px] text-slate-400">Status</p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-700 capitalize">
                                    {selectedSection?.status}
                                </p>
                            </div>

                            <div className="hidden h-7 w-px bg-slate-200 sm:block"></div>

                            <div>
                                <p className="text-[11px] text-slate-400">Students Shown</p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                    {viewStudents.length} <span className="text-xs font-normal text-slate-400">(max 5)</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">

                        {/* Student List Header */}
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700">
                                    Student List
                                </h4>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    Top 5 students assigned to this section
                                </p>
                            </div>

                            <div className="w-full sm:w-64">
                                <label className="input input-bordered input-sm flex w-full items-center gap-2 bg-slate-50 focus-within:border-emerald-500 focus-within:outline-none">
                                    <i className="fa-solid fa-magnifying-glass text-xs text-slate-400"></i>
                                    <input
                                        type="text"
                                        placeholder="Search student..."
                                        className="min-w-0 grow text-xs"
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleStudentSearch()}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Student Table — wired to SectionController@display_student */}
                        <div className="overflow-hidden rounded-lg border border-slate-200">
                            <div className="max-h-80 overflow-auto">
                                        <table className="w-full min-w-[760px] text-sm">
                                    <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
                                        <tr>
                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Student ID</th>
                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Full Name</th>
                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Gender</th>
                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Scripts Complete</th>
                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Performance</th>
                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Status</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {studentsLoading && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <RadialProgress
                                                            value={studentFetchProgress}
                                                            size="sm"
                                                            tone="emerald"
                                                            showValue={false}
                                                        />
                                                        <p className="text-xs text-slate-400">Loading students...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}

                                        {!studentsLoading && viewStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                                                    No students found.
                                                </td>
                                            </tr>
                                        )}

                                        {!studentsLoading && viewStudents.map((student) => {
                                            const progress = studentProgress.get(student.id);
                                            const needsImprovement = progress?.performance?.performanceLevel === "Needs Improvement";
                                            const allScriptsComplete = Boolean(progress && progress.totalScripts > 0 && progress.completedScripts === progress.totalScripts);
                                            return <tr key={student.id} className={`transition hover:bg-slate-50 ${needsImprovement ? "bg-rose-50/40" : ""}`}>
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{student.student_code}</td>
                                                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                                                    {student.first_name} {student.last_name}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{student.gender}</td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {progressLoading ? <span className="text-xs text-slate-400">Calculating…</span> : progressError ? <span className="text-xs text-slate-400">Unavailable</span> : !progress || progress.totalScripts === 0 ? <span className="text-xs text-slate-400">No scripts assigned</span> : <><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${allScriptsComplete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{allScriptsComplete ? "All complete" : "Incomplete"}</span><span className="mt-1 block text-xs text-slate-500">{progress.completedScripts}/{progress.totalScripts} scripts</span></>}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {progressLoading ? <span className="text-xs text-slate-400">Calculating…</span> : progressError ? <span className="text-xs text-slate-400">Unavailable</span> : progress?.performance ? <><span className="font-semibold text-slate-700">{progress.performance.averageAccuracy}%</span><span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getPerformanceBadgeClass(progress.performance.performanceLevel)}`}>{progress.performance.performanceLevel}</span>{needsImprovement && <span className="mt-1 block text-xs font-medium text-rose-700">Follow-up recommended</span>}</> : <span className="text-xs text-slate-400">No assessment results</span>}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <span
                                                        className={`badge badge-outline ${
                                                            student.status === "active" ? "badge-success" : "badge-neutral"
                                                        }`}
                                                    >
                                                        {student.status}
                                                    </span>
                                                </td>
                                            </tr>;
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 flex justify-end">
                            <form method="dialog">
                                <button type="submit" className="btn btn-sm">Close</button>
                            </form>
                        </div>
                    </div>
                </div>

                <form method="dialog" className="modal-backdrop">
                    <button type="submit">close</button>
                </form>
            </dialog>
        </div>
    );
}
