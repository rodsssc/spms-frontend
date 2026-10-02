import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Loading from "../../components/loading";
import ListPagination from "../../components/superadmin/listPagination";
import ManagementModal from "../../components/superadmin/managementModal";
import PageLoading from "../../components/superadmin/pageLoading";
import { errorMessage, showToast } from "../../services/superadmin/common.services";
import type { Adviser, Paginated, Section } from "../../services/superadmin/common.services";
import { getAdvisers } from "../../services/superadmin/adviser.services";
import { assignAdviser, getSections, saveSection } from "../../services/superadmin/section.services";
import type { SectionFilters } from "../../services/superadmin/section.services";

const input = "input input-bordered input-sm w-full focus:border-emerald-500 focus:outline-none";
const grades = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const schoolYears = ["2026-2027", "2027-2028", "2028-2029"];

export default function SuperAdminSections() {
    const [result, setResult] = useState<Paginated<Section> | null>(null);
    const [advisers, setAdvisers] = useState<Adviser[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<SectionFilters>({ year_level: "all", status: "all" });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Section | null>(null);

    const load = async () => {
        setLoading(true);
        try { setResult(await getSections({ ...filters, page, per_page: perPage })); }
        catch (error) { await showToast("error", "Unable to load sections", String(errorMessage(error))); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [filters, page, perPage]);
    useEffect(() => {
        getAdvisers({ per_page: 100 }).then(data => setAdvisers(data.data)).catch(error => void showToast("error", "Unable to load advisers", String(errorMessage(error))));
    }, []);

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = Object.fromEntries(
            [...new FormData(event.currentTarget).entries()].map(([key, value]) => [key, String(value)]),
        );
        const data: Record<string, string | number | null> = { ...formData };
        data.adviser_id = formData.adviser_id ? Number(formData.adviser_id) : null;
        setSubmitting(true);
        try {
            await saveSection(data, editing?.id);
            setOpen(false);
            await load();
            await showToast("success", editing ? "Section updated" : "Section added");
        } catch (error) { await showToast("error", "Unable to save section", String(errorMessage(error))); }
        finally { setSubmitting(false); }
    };

    const applySearch = (event: FormEvent) => {
        event.preventDefault();
        setPage(1);
        setFilters(current => ({ ...current, search: search.trim() || undefined }));
    };

    const changeAssignment = async (section: Section, adviserId: string) => {
        try { await assignAdviser(section.id, adviserId); await load(); await showToast("success", "Adviser assignment updated"); }
        catch (error) { await showToast("error", "Assignment failed", String(errorMessage(error))); }
    };

    const launch = (section: Section | null = null) => { setEditing(section); setOpen(true); };
    const schoolOptions = editing?.school_year && !schoolYears.includes(editing.school_year) ? [editing.school_year, ...schoolYears] : schoolYears;
    const gradeOptions = editing?.year_level && !grades.includes(editing.year_level) ? [editing.year_level, ...grades] : grades;

    return <>
        {loading ? <PageLoading label="Loading sections..."/> : <section className="overflow-hidden rounded-xl border-t-4 border-emerald-800 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="text-lg font-semibold text-slate-800">Section Records</h2><p className="mt-0.5 text-sm text-slate-500">Manage sections and adviser assignments</p></div><button className="btn btn-sm border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => launch()}><i className="fa-solid fa-plus"/> Add Section</button></div>
            <form className="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-[minmax(12rem,1fr)_11rem_10rem_auto_auto]" onSubmit={applySearch}>
                <input className={input} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search section, grade, or adviser"/>
                <select className="select select-bordered select-sm" value={filters.year_level ?? "all"} onChange={event => { setPage(1); setFilters(current => ({ ...current, year_level: event.target.value })); }}><option value="all">All grades</option>{grades.map(grade => <option key={grade}>{grade}</option>)}</select>
                <select className="select select-bordered select-sm" value={filters.status ?? "all"} onChange={event => { setPage(1); setFilters(current => ({ ...current, status: event.target.value })); }}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
                <select className="select select-bordered select-sm" value={perPage} onChange={event => { setPerPage(Number(event.target.value)); setPage(1); }}><option value={10}>10 per page</option><option value={25}>25 per page</option><option value={50}>50 per page</option></select>
                <button className="btn btn-sm border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"><i className="fa-solid fa-magnifying-glass"/> Search</button>
            </form>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600"><th className="px-4 py-3">Grade</th><th className="px-4 py-3">Section</th><th className="px-4 py-3">School Year</th><th className="px-4 py-3">Students</th><th className="px-4 py-3">Assigned Adviser</th><th className="px-4 py-3 text-center">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{result?.data.map(section => <tr key={section.id}><td className="px-4 py-3 text-slate-600">{section.year_level}</td><td className="px-4 py-3 font-medium text-slate-700">{section.section_name}</td><td className="px-4 py-3 text-slate-600">{section.school_year}</td><td className="px-4 py-3 text-slate-600">{section.students_count}</td><td className="px-4 py-3"><select className="select select-bordered select-sm" value={section.adviser_id ?? ""} onChange={event => void changeAssignment(section, event.target.value)}><option value="">Unassigned</option>{advisers.map(adviser => <option key={adviser.id} value={adviser.id}>{adviser.name}</option>)}</select></td><td className="px-4 py-3 text-center"><button className="btn btn-ghost btn-sm text-emerald-700" onClick={() => launch(section)}><i className="fa-solid fa-pen"/> Edit</button></td></tr>)}{result?.data.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No sections found.</td></tr>}</tbody></table></div>
            {result && <ListPagination page={result.current_page} lastPage={result.last_page} total={result.total} perPage={result.per_page} onChange={setPage}/>}
        </section>}
        <ManagementModal open={open} title={`${editing ? "Edit" : "Add"} Section`} description="Enter section details and assign an adviser." onClose={() => setOpen(false)}>
            <form key={editing?.id ?? "new-section"} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={save}>
                <label className="text-xs font-medium text-slate-600">Grade level<select className="select select-bordered select-sm w-full" name="year_level" defaultValue={editing?.year_level ?? ""} required><option value="" disabled>Select grade</option>{gradeOptions.map(grade => <option key={grade}>{grade}</option>)}</select></label>
                <label className="text-xs font-medium text-slate-600">Section name<input className={input} name="section_name" defaultValue={editing?.section_name ?? ""} required maxLength={255}/></label>
                <label className="text-xs font-medium text-slate-600">School year<select className="select select-bordered select-sm w-full" name="school_year" defaultValue={editing?.school_year ?? schoolYears[0]} required>{schoolOptions.map(year => <option key={year}>{year}</option>)}</select></label>
                <label className="text-xs font-medium text-slate-600">Adviser<select className="select select-bordered select-sm w-full" name="adviser_id" defaultValue={editing?.adviser_id ?? ""}><option value="">Unassigned</option>{advisers.map(adviser => <option key={adviser.id} value={adviser.id}>{adviser.name}</option>)}</select></label>
                <label className="text-xs font-medium text-slate-600">Status<select className="select select-bordered select-sm w-full" name="status" defaultValue={editing?.status ?? "active"}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                <div className="modal-action col-span-full mt-2"><button type="button" className="btn btn-sm" disabled={submitting} onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn btn-sm border-emerald-600 bg-emerald-600 text-white" disabled={submitting}>{submitting ? <><Loading size="xs" className="!text-white"/> Saving...</> : "Save Section"}</button></div>
            </form>
        </ManagementModal>
    </>;
}
