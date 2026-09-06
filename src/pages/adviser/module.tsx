import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ModuleItem {
    id: number;
    grade: string;
    name: string;
    schoolYear: string;
    scripts: number;
}

const SECTION_OPTIONS: Record<string, string[]> = {
    "Grade 4": ["Section Rizal", "Section Bonifacio"],
    "Grade 5": ["Section Aguinaldo", "Section Luna"],
    "Grade 6": ["Section Mabini", "Section Silang"],
};

export default function Module() {
    const navigate = useNavigate();
    const assignModalRef = useRef<HTMLDialogElement>(null);

    const [selectedModule, setSelectedModule] = useState<ModuleItem | null>(null);
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState("");

    const modules: ModuleItem[] = [
        {
            id: 1,
            grade: "Grade 6",
            name: "Module 1",
            schoolYear: "2026–2027",
            scripts: 5,
        },
        {
            id: 2,
            grade: "Grade 6",
            name: "Module 2",
            schoolYear: "2026–2027",
            scripts: 7,
        },
        {
            id: 3,
            grade: "Grade 5",
            name: "Module 1",
            schoolYear: "2026–2027",
            scripts: 4,
        },
        {
            id: 4,
            grade: "Grade 5",
            name: "Module 2",
            schoolYear: "2026–2027",
            scripts: 6,
        },
        {
            id: 5,
            grade: "Grade 4",
            name: "Module 1",
            schoolYear: "2026–2027",
            scripts: 5,
        },
        {
            id: 6,
            grade: "Grade 4",
            name: "Module 2",
            schoolYear: "2026–2027",
            scripts: 8,
        },
    ];

    function openAssignModal(module: ModuleItem) {
        setSelectedModule(module);
        setSelectedSections([]);
        setDueDate("");
        assignModalRef.current?.showModal();
    }

    function closeAssignModal() {
        assignModalRef.current?.close();
        setSelectedModule(null);
    }

    function toggleSection(section: string) {
        setSelectedSections((prev) =>
            prev.includes(section)
                ? prev.filter((s) => s !== section)
                : [...prev, section]
        );
    }

    function handleAssignSubmit() {
        // TODO: wire up to real assignment API.
        console.log("Assigning module", selectedModule?.id, {
            sections: selectedSections,
            dueDate,
        });
        closeAssignModal();
    }

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2">
            <div className="mx-auto w-full max-w-7xl">

                {/* =====================================================
                    PAGE HEADER
                ====================================================== */}
                <div className="mb-5 rounded-xl border-t-4 border-emerald-800 bg-white p-4 shadow-sm sm:p-5">

                    {/* Title */}
                    <div className="mb-4 flex items-center justify-between gap-3">

                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                                Module Management
                            </h1>

                            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                                Manage reading modules and their learning materials
                            </p>
                        </div>

                        {/* Add Module */}
                        <button
                            type="button"
                            className="btn shrink-0 border-emerald-600 bg-emerald-600 px-3 text-white shadow-sm hover:border-emerald-700 hover:bg-emerald-700 sm:px-4"
                        >
                            <i className="fa-solid fa-plus"></i>

                            <span className="hidden sm:inline">
                                Add Module
                            </span>
                        </button>

                    </div>

                    {/* =================================================
                        SEARCH / FILTER
                    ================================================== */}
                    <div className="flex w-full flex-col gap-2 sm:flex-row">

                        {/* Search */}
                        <div className="min-w-0 flex-1">
                            <label className="input input-bordered flex w-full items-center gap-2 bg-slate-50 focus-within:border-emerald-500 focus-within:outline-none">

                                <i className="fa-solid fa-magnifying-glass shrink-0 text-sm text-slate-400"></i>

                                <input
                                    type="text"
                                    placeholder="Search modules..."
                                    className="min-w-0 grow"
                                />

                            </label>
                        </div>

                        {/* Grade Filter */}
                        <select
                            className="select select-bordered w-full bg-white sm:w-40"
                            defaultValue=""
                        >
                            <option value="" disabled>
                                Grade Level
                            </option>

                            <option value="all">
                                All Grades
                            </option>

                            <option value="grade1">
                                Grade 1
                            </option>

                            <option value="grade2">
                                Grade 2
                            </option>

                            <option value="grade3">
                                Grade 3
                            </option>

                            <option value="grade4">
                                Grade 4
                            </option>

                            <option value="grade5">
                                Grade 5
                            </option>

                            <option value="grade6">
                                Grade 6
                            </option>
                        </select>

                        {/* School Year */}
                        <select
                            className="select select-bordered w-full bg-white sm:w-40"
                            defaultValue=""
                        >
                            <option value="" disabled>
                                School Year
                            </option>

                            <option value="all">
                                All Years
                            </option>

                            <option value="2026-2027">
                                2026–2027
                            </option>

                            <option value="2027-2028">
                                2027–2028
                            </option>
                        </select>

                        {/* Search Button */}
                        <button
                            type="button"
                            className="btn shrink-0 border-emerald-600 bg-emerald-600 text-white shadow-sm hover:border-emerald-700 hover:bg-emerald-700"
                        >
                            <i className="fa-solid fa-magnifying-glass"></i>

                            <span>
                                Search
                            </span>
                        </button>

                    </div>
                </div>


                {/* =====================================================
                    MODULE GRID
                ====================================================== */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                    {modules.map((module) => (
                        <div
                            key={module.id}
                            onClick={() => navigate(`/adviser/module/${module.id}`)}
                            className="w-full cursor-pointer rounded-xl border-t-2 border-emerald-800 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                        >

                            <div className="p-4">

                                {/* =================================================
                                    CARD HEADER
                                ================================================== */}
                                <div className="flex items-start justify-between gap-3">

                                    <div className="min-w-0">

                                        <p className="text-xs font-medium text-slate-400">
                                            {module.grade}
                                        </p>

                                        <h2 className="mt-0.5 truncate text-lg font-bold text-slate-800">
                                            {module.name}
                                        </h2>

                                    </div>

                                    {/* View */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/adviser/module/${module.id}`);
                                        }}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                                        title="View Module"
                                    >
                                        <i className="fa-solid fa-eye"></i>
                                    </button>

                                </div>


                                {/* Divider */}
                                <div className="my-3 border-t border-slate-100"></div>


                                {/* =================================================
                                    CARD DETAILS
                                ================================================== */}
                                <div className="flex items-end justify-between gap-3">

                                    {/* School Year */}
                                    <div className="min-w-0">

                                        <p className="text-xs text-slate-400">
                                            School Year
                                        </p>

                                        <p className="mt-0.5 text-sm font-medium text-slate-700">
                                            {module.schoolYear}
                                        </p>

                                    </div>


                                    {/* Reading Scripts */}
                                    <div className="shrink-0 text-right">

                                        <p className="text-xs text-slate-400">
                                            Reading Scripts
                                        </p>

                                        <p className="mt-0.5 text-lg font-bold text-emerald-600">
                                            {module.scripts}
                                        </p>

                                    </div>

                                </div>


                                {/* Divider */}
                                <div className="my-3 border-t border-slate-100"></div>


                                {/* =================================================
                                    ASSIGN BUTTON
                                ================================================== */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openAssignModal(module);
                                    }}
                                    className="btn btn-sm w-full border-emerald-600 bg-emerald-50 text-emerald-700 shadow-none hover:border-emerald-700 hover:bg-emerald-600 hover:text-white"
                                >
                                    <i className="fa-solid fa-user-plus"></i>
                                    Assign
                                </button>

                            </div>

                        </div>
                    ))}

                </div>

            </div>


            {/* =====================================================
                ASSIGN MODULE MODAL
            ====================================================== */}
            <dialog ref={assignModalRef} className="modal">
                <div className="modal-box max-w-md border-t-4 border-emerald-800">

                    {/* Modal Header */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-slate-800">
                                Assign Module
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {selectedModule
                                    ? `${selectedModule.grade} · ${selectedModule.name}`
                                    : "Select sections to assign this module to"}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeAssignModal}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    {/* Sections */}
                    <div className="mb-4">
                        <p className="mb-2 text-xs font-medium text-slate-500">
                            Assign to Sections
                        </p>

                        <div className="flex flex-col gap-2">
                            {(selectedModule ? SECTION_OPTIONS[selectedModule.grade] ?? [] : []).map(
                                (section) => (
                                    <label
                                        key={section}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                                    >
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm checkbox-success"
                                            checked={selectedSections.includes(section)}
                                            onChange={() => toggleSection(section)}
                                        />
                                        {section}
                                    </label>
                                )
                            )}

                            {selectedModule && (SECTION_OPTIONS[selectedModule.grade] ?? []).length === 0 && (
                                <p className="text-xs text-slate-400">
                                    No sections found for {selectedModule.grade}.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="mb-6">
                        <p className="mb-2 text-xs font-medium text-slate-500">
                            Due Date
                        </p>

                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="input input-bordered w-full bg-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeAssignModal}
                            className="btn btn-sm border-slate-200 bg-white text-slate-600 shadow-none hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleAssignSubmit}
                            disabled={selectedSections.length === 0}
                            className="btn btn-sm border-emerald-600 bg-emerald-600 text-white shadow-sm hover:border-emerald-700 hover:bg-emerald-700 disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400"
                        >
                            <i className="fa-solid fa-check"></i>
                            Assign Module
                        </button>
                    </div>

                </div>

                {/* Backdrop click to close */}
                <form method="dialog" className="modal-backdrop">
                    <button onClick={closeAssignModal}>close</button>
                </form>
            </dialog>

        </div>
    );
}