import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getAllSections, type Sections } from "../../services/adviser/section.services";
import RadialProgress from "../../components/radial_progress";
import { assignModuleSections, createModule, getAllModules, type Module as ModuleItem } from "../../services/adviser/module.services";

const GRADE_LEVELS = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

export default function Module() {
    const navigate = useNavigate();
    const assignModalRef = useRef<HTMLDialogElement>(null);
    const createModalRef = useRef<HTMLDialogElement>(null);
    const [modules, setModules] = useState<ModuleItem[]>([]);
    const [sections, setSections] = useState<Sections[]>([]);
    const [selectedModule, setSelectedModule] = useState<ModuleItem | null>(null);
    const [selectedSections, setSelectedSections] = useState<number[]>([]);
    const [search, setSearch] = useState("");
    const [yearLevel, setYearLevel] = useState("all");
    const [title, setTitle] = useState("");
    const [newYearLevel, setNewYearLevel] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fetchProgress, setFetchProgress] = useState(0);
    const [error, setError] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const moduleData = await getAllModules();
            setModules(moduleData);
        } catch {
            const message = "Unable to load modules.";
            setError(message);
            await Swal.fire({ icon: "error", title: "Unable to load modules", text: message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadData(); }, []);

    // The API does not expose byte progress, so mirror the student page by
    // advancing toward completion only while the module request is pending.
    useEffect(() => {
        if (!loading) {
            setFetchProgress(100);
            const reset = setTimeout(() => setFetchProgress(0), 300);
            return () => clearTimeout(reset);
        }
        setFetchProgress(10);
        const interval = setInterval(() => setFetchProgress((current) => current >= 90 ? 90 : current + 10), 150);
        return () => clearInterval(interval);
    }, [loading]);

    const filteredModules = useMemo(() => modules.filter((module) =>
        module.title.toLowerCase().includes(search.toLowerCase()) &&
        (yearLevel === "all" || module.year_level === yearLevel)
    ), [modules, search, yearLevel]);

    const availableSections = sections.filter((section) =>
        !selectedModule || section.year_level === selectedModule.year_level
    );

    async function openAssignModal(module: ModuleItem) {
        setSelectedModule(module);
        setSelectedSections(module.sections?.map((section) => section.id) ?? []);
        try {
            // Sections are fetched when assigning so recently created sections
            // are available without requiring a module-page refresh.
            const sectionData = await getAllSections();
            setSections(sectionData);
        } catch {
            await Swal.fire({ icon: "error", title: "Unable to load sections", text: "Please try again." });
            return;
        }
        assignModalRef.current?.showModal();
    }

    function closeAssignModal() {
        assignModalRef.current?.close();
        setSelectedModule(null);
    }

    function toggleSection(sectionId: number) {
        setSelectedSections((current) => current.includes(sectionId)
            ? current.filter((id) => id !== sectionId)
            : [...current, sectionId]);
    }

    async function handleAssignSubmit() {
        if (!selectedModule) return;
        setSaving(true);
        setError("");
        try {
            const updatedModule = await assignModuleSections(selectedModule.id, selectedSections);
            setModules((current) => current.map((module) => module.id === updatedModule.id ? updatedModule : module));
            closeAssignModal();
            await Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Module assigned", showConfirmButton: false, timer: 1800 });
        } catch {
            const message = "Unable to assign the module to sections.";
            setError(message);
            await Swal.fire({ toast: true, position: "top-end", icon: "error", title: "Assignment failed", text: message, showConfirmButton: false, timer: 2500 });
        } finally { setSaving(false); }
    }

    async function handleCreateModule() {
        setSaving(true);
        setError("");
        try {
            const module = await createModule({ title, year_level: newYearLevel, description });
            setModules((current) => [{ ...module, reading_scripts_count: 0, sections: [] }, ...current]);
            createModalRef.current?.close();
            setTitle(""); setNewYearLevel(""); setDescription("");
            await Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Module added", showConfirmButton: false, timer: 1800 });
        } catch {
            const message = "Unable to create the module.";
            setError(message);
            await Swal.fire({ toast: true, position: "top-end", icon: "error", title: "Unable to add module", text: message, showConfirmButton: false, timer: 2500 });
        } finally { setSaving(false); }
    }

    return <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2"><div className="mx-auto w-full max-w-7xl">
        <div className="mb-5 rounded-xl border-t-4 border-emerald-800 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><div><h1 className="text-xl font-bold text-slate-800 sm:text-2xl">Module Management</h1><p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Manage reading modules and assigned sections</p></div><button type="button" onClick={() => createModalRef.current?.showModal()} className="btn border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"><i className="fa-solid fa-plus" /> Add Module</button></div>
            <div className="flex flex-col gap-2 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search modules..." className="input input-bordered flex-1 bg-slate-50" /><select value={yearLevel} onChange={(event) => setYearLevel(event.target.value)} className="select select-bordered bg-white sm:w-44"><option value="all">All Grade Levels</option>{[...new Set(modules.map((module) => module.year_level))].map((level) => <option key={level} value={level}>{level}</option>)}</select></div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
        {loading ? <div className="flex min-h-80 items-center justify-center"><RadialProgress value={fetchProgress} size="lg" /></div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredModules.map((module) => <div key={module.id} onClick={() => navigate(`/adviser/module/${module.id}`)} className="cursor-pointer rounded-xl border-t-2 border-emerald-800 bg-white p-4 shadow-sm transition hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-slate-400">{module.year_level}</p><h2 className="truncate text-lg font-bold text-slate-800">{module.title}</h2></div><button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/adviser/module/${module.id}`); }} className="btn btn-ghost btn-sm btn-square"><i className="fa-solid fa-eye" /></button></div><p className="mt-3 line-clamp-2 min-h-10 text-sm text-slate-500">{module.description || "No description."}</p><div className="my-3 border-t border-slate-100" /><div className="flex justify-between text-sm"><span className="text-slate-500">Reading Scripts</span><span className="font-bold text-emerald-600">{module.reading_scripts_count ?? 0}</span></div><button type="button" onClick={(event) => { event.stopPropagation(); void openAssignModal(module); }} className="btn btn-sm mt-4 w-full border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"><i className="fa-solid fa-user-plus" /> Assign</button></div>)}{filteredModules.length === 0 && <p className="col-span-full py-10 text-center text-sm text-slate-500">No modules found.</p>}</div>}
    </div>
    <dialog ref={assignModalRef} className="modal"><div className="modal-box max-w-md border-t-4 border-emerald-800"><h3 className="text-lg font-bold text-slate-800">Assign Module</h3><p className="mb-4 text-sm text-slate-500">{selectedModule?.title}</p><div className="space-y-2">{availableSections.map((section) => <label key={section.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3"><input type="checkbox" checked={selectedSections.includes(section.id)} onChange={() => toggleSection(section.id)} className="checkbox checkbox-sm checkbox-success" /><span><span className="block font-medium text-slate-700">{section.section_name}</span><span className="text-xs text-slate-400">{section.year_level}</span></span></label>)}{availableSections.length === 0 && <p className="text-sm text-slate-500">No sections found for this grade level.</p>}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={closeAssignModal} className="btn btn-sm">Cancel</button><button type="button" onClick={() => void handleAssignSubmit()} disabled={saving} className="btn btn-sm border-emerald-600 bg-emerald-600 text-white">{saving ? "Saving..." : "Assign Module"}</button></div></div><form method="dialog" className="modal-backdrop"><button onClick={closeAssignModal}>close</button></form></dialog>
    <dialog ref={createModalRef} className="modal"><div className="modal-box max-w-md border-t-4 border-emerald-800"><h3 className="text-lg font-bold text-slate-800">Add Module</h3><div className="mt-4 space-y-3"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Module title" className="input input-bordered w-full" /><select value={newYearLevel} onChange={(event) => setNewYearLevel(event.target.value)} className="select select-bordered w-full"><option value="" disabled>Select year level</option>{GRADE_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}</select><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" className="textarea textarea-bordered w-full" /></div><div className="modal-action mt-4"><button type="button" onClick={() => createModalRef.current?.close()} disabled={saving} className="btn btn-sm">Cancel</button><button type="button" onClick={() => void handleCreateModule()} disabled={!title || !newYearLevel || saving} className="btn btn-sm border-emerald-600 bg-emerald-600 text-white">{saving ? "Saving..." : "Create Module"}</button></div></div><form method="dialog" className="modal-backdrop"><button>close</button></form></dialog>
    </div>;
}
