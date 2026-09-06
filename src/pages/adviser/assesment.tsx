import { useNavigate } from "react-router-dom";

interface AssessmentRow {
    id: number;
    studentName: string;
    studentIdNumber: string;
    section: string;
    module: string;
    script: string;
    assessmentDate: string;
    wpm: number;
    accuracy: number;
    fluencyLevel: "Independent" | "Instructional" | "Frustration";
}

/* =========================================================
   MOCK DATA (static)
   TODO: replace with real query on reading_assessments
   joined with students, reading_scripts, modules, sections.
========================================================= */
const ASSESSMENTS: AssessmentRow[] = [
    {
        id: 101,
        studentName: "Juan Dela Cruz",
        studentIdNumber: "STU-001",
        section: "Grade 3 - Rizal",
        module: "Module 1",
        script: "The Lost Kite",
        assessmentDate: "Aug 20, 2026",
        wpm: 85,
        accuracy: 96,
        fluencyLevel: "Independent",
    },
    {
        id: 102,
        studentName: "Maria Santos",
        studentIdNumber: "STU-002",
        section: "Grade 3 - Rizal",
        module: "Module 1",
        script: "The Lost Kite",
        assessmentDate: "Aug 20, 2026",
        wpm: 72,
        accuracy: 89,
        fluencyLevel: "Instructional",
    },
    {
        id: 103,
        studentName: "Pedro Garcia",
        studentIdNumber: "STU-003",
        section: "Grade 4 - Bonifacio",
        module: "Module 2",
        script: "How Bees Make Honey",
        assessmentDate: "Aug 19, 2026",
        wpm: 88,
        accuracy: 94,
        fluencyLevel: "Independent",
    },
    {
        id: 104,
        studentName: "Ana Reyes",
        studentIdNumber: "STU-004",
        section: "Grade 4 - Bonifacio",
        module: "Module 2",
        script: "How Bees Make Honey",
        assessmentDate: "Aug 19, 2026",
        wpm: 58,
        accuracy: 76,
        fluencyLevel: "Frustration",
    },
];

const FLUENCY_STYLES: Record<AssessmentRow["fluencyLevel"], { icon: string; text: string }> = {
    Independent: { icon: "fa-solid fa-circle-check", text: "text-emerald-600" },
    Instructional: { icon: "fa-solid fa-triangle-exclamation", text: "text-amber-600" },
    Frustration: { icon: "fa-solid fa-circle-exclamation", text: "text-red-600" },
};

export default function Assessment() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2">
            <div className="mx-auto w-full max-w-7xl">

                {/* =====================================================
                    PAGE HEADER
                ====================================================== */}
                <div className="mb-5 rounded-xl border-t-4 border-emerald-800 bg-white p-4 shadow-sm sm:p-5">

                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                                Assessments
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                                Reading assessment attempts across sections and modules
                            </p>
                        </div>
                    </div>

                    {/* SEARCH / FILTER */}
                    <div className="flex w-full flex-col gap-2 sm:flex-row">
                        <div className="min-w-0 flex-1">
                            <label className="input input-bordered flex w-full items-center gap-2 bg-slate-50 focus-within:border-emerald-500 focus-within:outline-none">
                                <i className="fa-solid fa-magnifying-glass shrink-0 text-sm text-slate-400"></i>
                                <input
                                    type="text"
                                    placeholder="Search student..."
                                    className="min-w-0 grow"
                                />
                            </label>
                        </div>

                        <select className="select select-bordered w-full bg-white sm:w-40" defaultValue="">
                            <option value="" disabled>Section</option>
                            <option value="all">All Sections</option>
                            <option value="rizal">Grade 3 - Rizal</option>
                            <option value="bonifacio">Grade 4 - Bonifacio</option>
                        </select>

                        <select className="select select-bordered w-full bg-white sm:w-40" defaultValue="">
                            <option value="" disabled>Module</option>
                            <option value="all">All Modules</option>
                            <option value="module1">Module 1</option>
                            <option value="module2">Module 2</option>
                        </select>

                        <button
                            type="button"
                            className="btn shrink-0 border-emerald-600 bg-emerald-600 text-white shadow-sm hover:border-emerald-700 hover:bg-emerald-700"
                        >
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <span>Search</span>
                        </button>
                    </div>
                </div>

                {/* =====================================================
                    ASSESSMENTS TABLE
                ====================================================== */}
                <div className="rounded-xl border-t-4 border-emerald-800 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-xs text-slate-500">
                                    <th className="px-6 py-3 font-medium">Student</th>
                                    <th className="px-6 py-3 font-medium">Section</th>
                                    <th className="px-6 py-3 font-medium">Module / Script</th>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">WPM</th>
                                    <th className="px-6 py-3 font-medium">Accuracy</th>
                                    <th className="px-6 py-3 font-medium">Fluency Level</th>
                                    <th className="px-6 py-3 font-medium"></th>
                                </tr>
                            </thead>

                            <tbody>
                                {ASSESSMENTS.map((row) => {
                                    const status = FLUENCY_STYLES[row.fluencyLevel];
                                    return (
                                        <tr
                                            key={row.id}
                                            onClick={() => navigate(`/adviser/assessment-result/${row.id}`)}
                                            className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-emerald-50/50"
                                        >
                                            <td className="px-6 py-3">
                                                <p className="font-medium text-slate-700">{row.studentName}</p>
                                                <p className="text-xs text-slate-400">{row.studentIdNumber}</p>
                                            </td>
                                            <td className="px-6 py-3 text-slate-600">{row.section}</td>
                                            <td className="px-6 py-3 text-slate-600">
                                                {row.module} · {row.script}
                                            </td>
                                            <td className="px-6 py-3 text-slate-600">{row.assessmentDate}</td>
                                            <td className="px-6 py-3 font-medium text-slate-700">{row.wpm} WPM</td>
                                            <td className="px-6 py-3 font-medium text-slate-700">{row.accuracy}%</td>
                                            <td className="px-6 py-3">
                                                <span className={`flex items-center gap-1.5 font-medium ${status.text}`}>
                                                    <i className={status.icon} />
                                                    {row.fluencyLevel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <i className="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}