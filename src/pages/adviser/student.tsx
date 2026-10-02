import { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import Loading from "../../components/loading";
import RadialProgress from "../../components/radial_progress";
import {
    getAllSections,
    getAllStudents,
    createStudent,
    updateStudent,
    deleteStudent,
} from "../../services/adviser/student.services";
import type { Students, Section, StudentFilters } from "../../services/adviser/student.services";
import { getAssessments } from "../../services/adviser/assessment.services";
import { calculateStudentPerformance, getPerformanceBadgeClass, getPerformanceLevel, type StudentPerformance } from "../../services/adviser/performance";
import AssessmentResult from "./assessment_result";

export default function Student() {
    const canManage = false;
    const addModalRef = useRef<HTMLDialogElement>(null);
    const editModalRef = useRef<HTMLDialogElement>(null);
    const viewModalRef = useRef<HTMLDialogElement>(null);

    const [students, setStudents] = useState<Students[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Separate flag for add/edit/delete actions so the table doesn't
    // flash a full loading state for a quick modal save/delete
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Drives the RadialProgress shown in the table while a fetch is in flight.
    // There's no real byte/row progress from the API, so this animates toward
    // 90% and only reaches 100% once the request actually resolves.
    const [fetchProgress, setFetchProgress] = useState<number>(0);

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterPerformance, setFilterPerformance] = useState<StudentFilters["performance_level"]>("all");
    const [performanceByStudent, setPerformanceByStudent] = useState<Map<number, StudentPerformance>>(new Map());
    const [performanceLoading, setPerformanceLoading] = useState(true);
    const [performanceError, setPerformanceError] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [lastPage, setLastPage] = useState<number>(1);
    const [totalStudents, setTotalStudents] = useState<number>(0);
    const [perPage] = useState<number>(10);

    const [selectedStudent, setSelectedStudent] = useState<Students | null>(null);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Shared form fields (used by both Add and Edit modals)
    const [studentCode, setStudentCode] = useState<string>("");
    const [sectionId, setSectionId] = useState<string>("");
    const [firstName, setFirstName] = useState<string>("");
    const [middleName, setMiddleName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [gender, setGender] = useState<string>("");
    const [birthdate, setBirthdate] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [guardianName, setGuardianName] = useState<string>("");
    const [guardianContact, setGuardianContact] = useState<string>("");
    const [status, setStatus] = useState<"active" | "inactive">("active");

    const selectedPerformance = selectedStudent ? performanceByStudent.get(selectedStudent.id) : undefined;

    useEffect(() => {
        fetchSections();
    }, []);

    useEffect(() => {
        let active = true;
        getAssessments()
            .then((records) => {
                if (active) setPerformanceByStudent(new Map(calculateStudentPerformance(records).map((item) => [item.studentId, item])));
            })
            .catch(() => active && setPerformanceError(true))
            .finally(() => active && setPerformanceLoading(false));
        return () => { active = false; };
    }, []);

    // Animate the radial progress while a fetch is running
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

    // Refetch whenever the page changes
    useEffect(() => {
        fetchStudents({
            search: searchTerm || undefined,
            status: filterStatus,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const fetchStudents = async (filters?: StudentFilters) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllStudents({
                page: currentPage,
                per_page: perPage,
                performance_level: filterPerformance,
                ...filters,
            });
            setStudents(data.data);
            setLastPage(data.last_page);
            setTotalStudents(data.total);
        } catch (err: any) {
            console.log(err);
            const message = err.response?.data?.message || "Failed to fetch students. Please try again later.";
            setError(message);
            await Swal.fire({
                icon: "error",
                title: "Unable to load students",
                text: message,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchSections = async () => {
        try {
            const data = await getAllSections();
            setSections(data);
        } catch (err) {
            console.log(err);
        }
    };

    const handleSearch = () => {
        if (currentPage !== 1) {
            setCurrentPage(1); // triggers refetch via the effect above
        } else {
            fetchStudents({
                search: searchTerm || undefined,
                status: filterStatus,
            });
        }
    };

    const handleStatusChange = (value: string) => {
        setFilterStatus(value);
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchStudents({ search: searchTerm || undefined, status: value });
        }
    };

    const handlePerformanceChange = (value: NonNullable<StudentFilters["performance_level"]>) => {
        setFilterPerformance(value);
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchStudents({ search: searchTerm || undefined, status: filterStatus, performance_level: value });
        }
    };

    const goToPage = (page: number) => {
        if (page < 1 || page > lastPage || page === currentPage) return;
        setCurrentPage(page);
    };

    const resetForm = () => {
        setStudentCode("");
        setSectionId("");
        setFirstName("");
        setMiddleName("");
        setLastName("");
        setGender("");
        setBirthdate("");
        setAddress("");
        setGuardianName("");
        setGuardianContact("");
        setStatus("active");
    };

    const openAddModal = () => {
        setEditingId(null);
        resetForm();
        addModalRef.current?.showModal();
    };

    const openEditModal = (student: Students) => {
        setEditingId(student.id);
        setStudentCode(student.student_code);
        setSectionId(String(student.section.id));
        setFirstName(student.first_name);
        setMiddleName(student.middle_name);
        setLastName(student.last_name);
        setGender(student.gender);
        setBirthdate(student.birthdate);
        setAddress(student.address);
        setGuardianName(student.gurdian_name);
        setGuardianContact(student.gurdian_contact);
        setStatus(student.status as "active" | "inactive");
        editModalRef.current?.showModal();
    };

    const openViewModal = (student: Students) => {
        setSelectedStudent(student);
        viewModalRef.current?.showModal();
    };

    const handleAddStudent = async () => {
        try {
            setSubmitting(true);
            await createStudent({
                section_id: Number(sectionId),
                first_name: firstName,
                middle_name: middleName,
                last_name: lastName,
                gender,
                birthdate,
                address,
                gurdian_name: guardianName,
                gurdian_contact: guardianContact,
                status,
            });

            resetForm();
            addModalRef.current?.close();
            await fetchStudents({ search: searchTerm || undefined, status: filterStatus });

            await Swal.fire({
                toast: true,
                icon: "success",
                title: "Student Added!",
                position: "top-end",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
                width: "320px",
            });
        } catch (err: any) {
            console.log(err.response?.data?.message);
            await Swal.fire({
                toast: true,
                icon: "error",
                title: "Failed to Add Student",
                text: err.response?.data?.message || "Something went wrong while adding the student.",
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

    const handleUpdateStudent = async () => {
        if (!editingId) return;

        try {
            setSubmitting(true);
            await updateStudent(editingId, {
                section_id: Number(sectionId),
                first_name: firstName,
                middle_name: middleName,
                last_name: lastName,
                gender,
                birthdate,
                address,
                gurdian_name: guardianName,
                gurdian_contact: guardianContact,
                status,
            });

            editModalRef.current?.close();
            await fetchStudents({ search: searchTerm || undefined, status: filterStatus });

            await Swal.fire({
                toast: true,
                icon: "success",
                title: "Student Updated!",
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
                title: "Failed to Update Student",
                text: err.response?.data?.message || "Something went wrong while updating the student.",
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

    const handleDeleteStudent = async (student: Students) => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Delete this student?",
            text: `${student.first_name} ${student.last_name} will be permanently removed.`,
            showCancelButton: true,
            confirmButtonText: "Delete",
            confirmButtonColor: "#dc2626",
        });

        if (!result.isConfirmed) return;

        try {
            await deleteStudent(student.id);

            // If we deleted the last item on a page beyond page 1, step back a page
            if (students.length === 1 && currentPage > 1) {
                setCurrentPage((p) => p - 1);
            } else {
                await fetchStudents({ search: searchTerm || undefined, status: filterStatus });
            }

            await Swal.fire({
                toast: true,
                icon: "success",
                title: "Student Deleted",
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
                title: "Failed to Delete Student",
                text: err.response?.data?.message || "Something went wrong while deleting the student.",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
                width: "320px",
                position: "top-end",
            });
        }
    };

    // Build a compact page-number list (with ellipses) for the pager
    const getPageNumbers = (): (number | "...")[] => {
        const pages: (number | "...")[] = [];
        const maxVisible = 5;

        if (lastPage <= maxVisible + 2) {
            for (let i = 1; i <= lastPage; i++) pages.push(i);
            return pages;
        }

        pages.push(1);
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(lastPage - 1, currentPage + 1);

        if (currentPage <= 3) {
            start = 2;
            end = 4;
        } else if (currentPage >= lastPage - 2) {
            start = lastPage - 3;
            end = lastPage - 1;
        }

        if (start > 2) pages.push("...");
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < lastPage - 1) pages.push("...");

        pages.push(lastPage);
        return pages;
    };

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2">
            <div className="mx-auto w-full max-w-7xl">

                {/* Page Header */}
                <div className="mb-5 rounded-xl border-t-4 border-emerald-800 bg-white shadow-sm p-4 sm:p-5">

                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                                Student Overview
                            </h1>
                            <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">
                                View students assigned to your sections
                            </p>
                        </div>

                        {canManage && <button type="button" onClick={openAddModal} className="btn shrink-0 border-emerald-600 bg-emerald-600 px-3 text-white shadow-sm hover:bg-emerald-700">
                            <i className="fa-solid fa-plus"></i><span className="hidden sm:inline">Add Student</span>
                        </button>}

                    </div>

                    {/* Search / Filter Toolbar */}
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <div className="min-w-0 flex-1">
                            <label className="input input-bordered flex w-full items-center gap-2 bg-slate-50 focus-within:border-emerald-500 focus-within:outline-none">
                                <i className="fa-solid fa-magnifying-glass shrink-0 text-sm text-slate-400"></i>
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    className="min-w-0 grow"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </label>
                        </div>

                        <select
                            className="select select-bordered w-full bg-white sm:w-36 md:w-40"
                            value={filterStatus}
                            onChange={(e) => handleStatusChange(e.target.value)}
                        >
                            <option value="all">All Students</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <select
                            aria-label="Filter students by performance"
                            className="select select-bordered w-full bg-white sm:w-52"
                            value={filterPerformance}
                            onChange={(e) => handlePerformanceChange(e.target.value as NonNullable<StudentFilters["performance_level"]>)}
                        >
                            <option value="all">All Performance Levels</option>
                            <option value="highly_confident">Highly Confident</option>
                            <option value="confident">Confident</option>
                            <option value="developing">Developing</option>
                            <option value="needs_improvement">Needs Improvement</option>
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

                {/* Student Table */}
                <div className="overflow-hidden rounded-xl border-t-4 border-emerald-800 bg-white shadow-sm">

                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
                        <div>
                            <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
                                Student Records
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                                List of registered students
                            </p>
                        </div>

                        <p className="text-xs text-slate-500 sm:text-sm">
                            {totalStudents} Students
                        </p>
                    </div>

                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                    <th className="px-4 py-3 font-semibold text-slate-600">Student ID</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Full Name</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Grade</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Section</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Performance</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Address</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                                    <th className="w-16 px-4 py-3 text-center font-semibold text-slate-600">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <RadialProgress
                                                    value={fetchProgress}
                                                    size="md"
                                                    tone="emerald"
                                                    showValue={false}
                                                />
                                                <p className="text-xs text-slate-400">Loading students...</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {!loading && !error && students.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                                            No students found.
                                        </td>
                                    </tr>
                                )}

                                {!loading && students.map((student) => (
                                    <tr key={student.id} className={`transition-colors hover:bg-slate-50 ${performanceByStudent.get(student.id)?.performanceLevel === "Needs Improvement" ? "border-l-4 border-l-rose-500 bg-rose-50/40" : ""}`}>
                                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                                            {student.student_code}
                                        </td>

                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-700">
                                                {student.first_name} {student.last_name}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                            {student.section.year_level}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                            {student.section.section_name}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {performanceLoading ? <span className="text-xs text-slate-400">Loading results…</span> : performanceError ? <span className="text-xs text-slate-400">Unavailable</span> : performanceByStudent.has(student.id) ? <><span className="font-semibold text-slate-700">{performanceByStudent.get(student.id)?.averageAccuracy}%</span><span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getPerformanceBadgeClass(performanceByStudent.get(student.id)!.performanceLevel)}`}>{performanceByStudent.get(student.id)?.performanceLevel}</span>{performanceByStudent.get(student.id)?.performanceLevel === "Needs Improvement" && <span className="mt-1 block text-xs font-medium text-rose-700">Follow-up recommended</span>}</> : <span className="text-xs text-slate-400">No results</span>}
                                        </td>

                                        <td className="px-4 py-3 text-slate-500">
                                            {student.address}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {student.status === "active" ? (
                                                <span className="rounded-full  px-2.5 py-1 text-xs font-medium text-emerald-600">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="rounded-full  px-2.5 py-1 text-xs font-medium text-red-600">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            <div className="dropdown dropdown-end">
                                                <button
                                                    type="button"
                                                    tabIndex={0}
                                                    className="btn btn-ghost btn-sm h-8 min-h-8 w-8 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                                >
                                                    <i className="fa-solid fa-ellipsis-vertical"></i>
                                                </button>

                                                <ul
                                                    tabIndex={0}
                                                    className="dropdown-content menu z-50 mt-1 w-36 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
                                                >
                                                    <li>
                                                        <button type="button" onClick={() => openViewModal(student)}>
                                                            <i className="fa-solid fa-eye w-4"></i>
                                                            View
                                                        </button>
                                                    </li>

                                                    {canManage && <li><button type="button" onClick={() => openEditModal(student)}><i className="fa-solid fa-pen w-4"></i>Edit</button></li>}
                                                    {canManage && <li><button type="button" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteStudent(student)}><i className="fa-solid fa-trash w-4"></i>Delete</button></li>}

                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <p className="text-xs text-slate-500 sm:text-sm">
                            Showing <span className="font-medium text-slate-700">{students.length}</span> of{" "}
                            <span className="font-medium text-slate-700">{totalStudents}</span> students
                        </p>

                        {lastPage > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => goToPage(currentPage - 1)}
                                    className="btn btn-sm btn-ghost disabled:opacity-40"
                                >
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>

                                {getPageNumbers().map((page, idx) =>
                                    page === "..." ? (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400">
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => goToPage(page)}
                                            className={`btn btn-sm h-8 min-h-8 w-8 p-0 ${
                                                page === currentPage
                                                    ? "border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700"
                                                    : "btn-ghost text-slate-600"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}

                                <button
                                    type="button"
                                    disabled={currentPage >= lastPage}
                                    onClick={() => goToPage(currentPage + 1)}
                                    className="btn btn-sm btn-ghost disabled:opacity-40"
                                >
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Student Modal */}
            <dialog ref={addModalRef} className="modal">
                <div className="modal-box w-11/12 max-w-3xl rounded-xl border-t-5 border-emerald-800 bg-white shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Add Student</h3>
                            <p className="mt-1 text-xs text-slate-500">Enter the student's information below.</p>
                        </div>
                        <form method="dialog">
                            <button type="submit" className="btn btn-circle btn-ghost btn-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </form>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Middle Name</label>
                            <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Middle name" className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Gender <span className="text-red-500">*</span>
                            </label>
                            <select value={gender} onChange={(e) => setGender(e.target.value)} className="select select-bordered select-sm w-full">
                                <option value="" disabled>Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Birth Date <span className="text-red-500">*</span>
                            </label>
                            <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Section <span className="text-red-500">*</span>
                            </label>
                            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="select select-bordered select-sm w-full">
                                <option value="" disabled>Select section</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.section_name} ({section.year_level})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address" className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Guardian Name <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Guardian name" className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Guardian Contact <span className="text-red-500">*</span>
                            </label>
                            <input type="tel" value={guardianContact} onChange={(e) => setGuardianContact(e.target.value)} placeholder="09XXXXXXXXX" className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")} className="select select-bordered select-sm w-full">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-action mt-4">
                        <form method="dialog">
                            <button type="submit" disabled={submitting} className="btn btn-sm">Cancel</button>
                        </form>
                        <button
                            type="button"
                            onClick={handleAddStudent}
                            disabled={submitting}
                            className="btn btn-sm border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700 disabled:opacity-70"
                        >
                            {submitting ? (
                                <Loading size="xs" className="!text-white" />
                            ) : (
                                <i className="fa-solid fa-floppy-disk"></i>
                            )}
                            {submitting ? "Saving..." : "Save Student"}
                        </button>
                    </div>
                </div>

                <form method="dialog" className="modal-backdrop">
                    <button type="submit">close</button>
                </form>
            </dialog>

            {/* Edit Student Modal — same layout/styling as Add modal */}
            <dialog ref={editModalRef} className="modal">
                <div className="modal-box w-11/12 max-w-3xl rounded-xl border-t-5 border-emerald-800 bg-white shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Edit Student</h3>
                            <p className="mt-1 text-xs text-slate-500">Update the student's information below.</p>
                        </div>
                        <form method="dialog">
                            <button type="submit" className="btn btn-circle btn-ghost btn-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </form>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-600">Student Code</label>
                            <input
                                type="text"
                                value={studentCode}
                                disabled
                                className="input input-bordered input-sm w-full bg-slate-100 text-slate-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Middle Name</label>
                            <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Middle name" className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Gender <span className="text-red-500">*</span>
                            </label>
                            <select value={gender} onChange={(e) => setGender(e.target.value)} className="select select-bordered select-sm w-full">
                                <option value="" disabled>Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Birth Date <span className="text-red-500">*</span>
                            </label>
                            <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Section <span className="text-red-500">*</span>
                            </label>
                            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="select select-bordered select-sm w-full">
                                <option value="" disabled>Select section</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.section_name} ({section.year_level})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address" className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Guardian Name <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Guardian name" className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Guardian Contact <span className="text-red-500">*</span>
                            </label>
                            <input type="tel" value={guardianContact} onChange={(e) => setGuardianContact(e.target.value)} placeholder="09XXXXXXXXX" className="input input-bordered input-sm w-full" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")} className="select select-bordered select-sm w-full">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-action mt-4">
                        <form method="dialog">
                            <button type="submit" disabled={submitting} className="btn btn-sm">Cancel</button>
                        </form>
                        <button
                            type="button"
                            onClick={handleUpdateStudent}
                            disabled={submitting}
                            className="btn btn-sm border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700 disabled:opacity-70"
                        >
                            {submitting ? (
                                <Loading size="xs" className="!text-white" />
                            ) : (
                                <i className="fa-solid fa-floppy-disk"></i>
                            )}
                            {submitting ? "Updating..." : "Update Student"}
                        </button>
                    </div>
                </div>

                <form method="dialog" className="modal-backdrop">
                    <button type="submit">close</button>
                </form>
            </dialog>

            {/* View Student Modal */}
            <dialog ref={viewModalRef} className="modal">
                <div className="modal-box w-11/12 max-h-[90vh] max-w-4xl overflow-y-auto p-0 rounded-xl border-t-5 border-emerald-800 bg-white shadow-sm">
                    <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Student Details</h3>
                            <p className="mt-0.5 text-xs text-slate-500">View student information</p>
                        </div>
                        <form method="dialog">
                            <button type="submit" className="btn btn-circle btn-ghost btn-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Close">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </form>
                    </div>

                    <div className="p-5">
                        <div className="mb-4 flex flex-col gap-3 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <i className="fa-solid fa-user"></i>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="truncate text-base font-semibold text-slate-800">
                                        {selectedStudent?.first_name} {selectedStudent?.middle_name} {selectedStudent?.last_name}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Student ID: {selectedStudent?.student_code}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <i className="fa-solid fa-circle text-[8px] text-emerald-500"></i>
                                <span className="font-medium capitalize text-slate-600">
                                    {selectedStudent?.status}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200">
                            <div className="border-b border-slate-200 px-4 py-2.5">
                                <h4 className="text-sm font-semibold text-slate-700">Student Information</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-4 sm:grid-cols-4">
                                <div>
                                    <p className="text-[11px] text-slate-400">First Name</p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-700">{selectedStudent?.first_name}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400">Middle Name</p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-700">{selectedStudent?.middle_name || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400">Last Name</p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-700">{selectedStudent?.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400">Gender</p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-700">{selectedStudent?.gender}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400">Birth Date</p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-700">{selectedStudent?.birthdate}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400">Section</p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-700">
                                        {selectedStudent?.section.section_name} ({selectedStudent?.section.year_level})
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[11px] text-slate-400">Address</p>
                                    <p className="mt-0.5 truncate text-sm font-medium text-slate-700">{selectedStudent?.address}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-lg border border-slate-200">
                            <div className="border-b border-slate-200 px-4 py-2.5">
                                <h4 className="text-sm font-semibold text-slate-700">Guardian Information</h4>
                            </div>

                            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-[11px] text-slate-400">Guardian Name</p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-700">{selectedStudent?.gurdian_name}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400">Guardian Contact</p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-700">{selectedStudent?.gurdian_contact}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                            <div className="border-b border-slate-200 px-4 py-2.5">
                                <h4 className="text-sm font-semibold text-slate-700">Student Performance Summary</h4>
                                <p className="mt-0.5 text-xs text-slate-500">Calculated from this student’s completed assessment results.</p>
                            </div>
                            <div className="p-4">
                                {performanceLoading ? <div className="flex justify-center py-6"><span className="loading loading-spinner loading-sm text-emerald-700" /></div>
                                    : performanceError ? <p className="py-4 text-sm text-slate-500">Assessment results are unavailable.</p>
                                    : selectedPerformance ? <>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[11px] font-medium text-slate-500">Average Accuracy</p><p className="mt-1 text-xl font-bold text-slate-800">{selectedPerformance.averageAccuracy}%</p></div>
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[11px] font-medium text-slate-500">Performance Level</p><span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPerformanceBadgeClass(selectedPerformance.performanceLevel)}`}>{selectedPerformance.performanceLevel}</span></div>
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[11px] font-medium text-slate-500">Completed Assessments</p><p className="mt-1 text-xl font-bold text-slate-800">{selectedPerformance.assessmentCount}</p></div>
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[11px] font-medium text-slate-500">Correct Words</p><p className="mt-1 text-xl font-bold text-slate-800">{selectedPerformance.assessments.reduce((total, assessment) => total + assessment.correct_words, 0)} <span className="text-sm font-medium text-slate-400">/ {selectedPerformance.assessments.reduce((total, assessment) => total + assessment.total_words, 0)}</span></p></div>
                                        </div>
                                        {selectedPerformance.performanceLevel === "Needs Improvement" && <p role="status" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"><i className="fa-solid fa-triangle-exclamation mr-1.5" />This student may benefit from additional reading support.</p>}
                                    </> : <p className="py-4 text-sm text-slate-500">No completed assessment results are available for this student yet.</p>}
                            </div>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
                                <div><h4 className="text-sm font-semibold text-slate-700">Reading Script Results</h4><p className="mt-0.5 text-xs text-slate-500">Scores and submission dates by module.</p></div>
                                {selectedPerformance && <span className="text-xs text-slate-500">{selectedPerformance.assessmentCount} results</span>}
                            </div>
                            {performanceLoading ? <div className="flex justify-center py-8"><span className="loading loading-spinner loading-sm text-emerald-700" /></div>
                                : performanceError ? <p className="px-4 py-6 text-sm text-slate-500">Assessment results are unavailable.</p>
                                : selectedPerformance?.assessments.length ? <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">{selectedPerformance.assessments.map((assessment) => {
                                    const level = getPerformanceLevel(assessment.accuracy);
                                    const submittedAt = new Date(assessment.created_at);
                                    return <div key={assessment.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-700">{assessment.script_title}</p><p className="mt-0.5 text-xs text-slate-500">{assessment.module} · {submittedAt.toLocaleDateString()} at {submittedAt.toLocaleTimeString()}</p></div>
                                        <div className="flex items-center justify-between gap-3 sm:justify-end"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getPerformanceBadgeClass(level)}`}>{assessment.accuracy}% · {level}</span><button type="button" onClick={() => { viewModalRef.current?.close(); setSelectedAssessmentId(assessment.id); }} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">View result</button></div>
                                    </div>;
                                })}</div> : <p className="px-4 py-6 text-sm text-slate-500">No completed reading scripts yet.</p>}
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-slate-200 px-5 py-3">
                        <form method="dialog">
                            <button type="submit" className="btn btn-sm">Close</button>
                        </form>
                    </div>
                </div>

                <form method="dialog" className="modal-backdrop">
                    <button type="submit">close</button>
                </form>
            </dialog>
            {selectedAssessmentId !== null && <AssessmentResult assessmentId={selectedAssessmentId} onClose={() => setSelectedAssessmentId(null)} />}
        </div>
    );
}
