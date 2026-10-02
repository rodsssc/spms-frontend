import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Loading from "../../components/loading";
import ListPagination from "../../components/superadmin/listPagination";
import ManagementModal from "../../components/superadmin/managementModal";
import PageLoading from "../../components/superadmin/pageLoading";
import { errorMessage, getSectionsForForms, showToast } from "../../services/superadmin/common.services";
import type { Paginated, Section, Student } from "../../services/superadmin/common.services";
import { getStudents, saveStudent } from "../../services/superadmin/student.services";
import type { StudentFilters } from "../../services/superadmin/student.services";

const input = "input input-bordered input-sm w-full focus:border-emerald-500 focus:outline-none";

export default function SuperAdminStudents() {
    const [result, setResult] = useState<Paginated<Student> | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<StudentFilters>({ status: "all", section_id: "all" });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Student | null>(null);

    const load = async () => {
        setLoading(true);
        try { setResult(await getStudents({ ...filters, page, per_page: perPage })); }
        catch (error) { await showToast("error", "Unable to load students", String(errorMessage(error))); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [filters, page, perPage]);
    useEffect(() => { getSectionsForForms().then(setSections).catch(error => void showToast("error", "Unable to load sections", String(errorMessage(error)))); }, []);

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
        const data: Record<string, string | number> = { ...formData, section_id: Number(formData.section_id) };
        setSubmitting(true);
        try {
            await saveStudent(data, editing?.id);
            setOpen(false);
            await load();
            await showToast("success", editing ? "Student updated" : "Student added");
        } catch (error) { await showToast("error", "Unable to save student", String(errorMessage(error))); }
        finally { setSubmitting(false); }
    };

    const applySearch = (event: FormEvent) => {
        event.preventDefault();
        setPage(1);
        setFilters(current => ({ ...current, search: search.trim() || undefined }));
    };
    const launch = (student: Student | null = null) => { setEditing(student); setOpen(true); };

    return <>
        {loading ? <PageLoading label="Loading students..."/> : <section className="overflow-hidden rounded-xl border-t-4 border-emerald-800 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="text-lg font-semibold text-slate-800">Student Records</h2><p className="mt-0.5 text-sm text-slate-500">All registered students</p></div><button className="btn btn-sm border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => launch()}><i className="fa-solid fa-plus"/> Add Student</button></div>
            <form className="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-[minmax(12rem,1fr)_10rem_12rem_auto_auto]" onSubmit={applySearch}>
                <input className={input} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name or student ID"/>
                <select className="select select-bordered select-sm" value={filters.status ?? "all"} onChange={event => { setPage(1); setFilters(current => ({ ...current, status: event.target.value })); }}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
                <select className="select select-bordered select-sm" value={filters.section_id ?? "all"} onChange={event => { setPage(1); setFilters(current => ({ ...current, section_id: event.target.value })); }}><option value="all">All sections</option>{sections.map(section => <option key={section.id} value={section.id}>{section.year_level} – {section.section_name}</option>)}</select>
                <select className="select select-bordered select-sm" value={perPage} onChange={event => { setPerPage(Number(event.target.value)); setPage(1); }}><option value={10}>10 per page</option><option value={25}>25 per page</option><option value={50}>50 per page</option></select>
                <button className="btn btn-sm border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"><i className="fa-solid fa-magnifying-glass"/> Search</button>
            </form>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600"><th className="px-4 py-3">Student ID</th><th className="px-4 py-3">Full Name</th><th className="px-4 py-3">Grade</th><th className="px-4 py-3">Section</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-center">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{result?.data.map(student => <tr key={student.id}><td className="px-4 py-3 font-medium text-slate-600">{student.student_code}</td><td className="px-4 py-3 text-slate-700">{student.first_name} {student.last_name}</td><td className="px-4 py-3 text-slate-600">{student.section?.year_level}</td><td className="px-4 py-3 text-slate-600">{student.section?.section_name}</td><td className="px-4 py-3 capitalize text-slate-600">{student.status}</td><td className="px-4 py-3 text-center"><button className="btn btn-ghost btn-sm text-emerald-700" onClick={() => launch(student)}><i className="fa-solid fa-pen"/> Edit</button></td></tr>)}{result?.data.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No students found.</td></tr>}</tbody></table></div>
            {result && <ListPagination page={result.current_page} lastPage={result.last_page} total={result.total} perPage={result.per_page} onChange={setPage}/>}
        </section>}
        <ManagementModal open={open} title={`${editing ? "Edit" : "Add"} Student`} description="Enter the student's information below." onClose={() => setOpen(false)}>
            <form key={editing?.id ?? "new-student"} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={save}>
                <label className="text-xs font-medium text-slate-600">First name<input className={input} name="first_name" defaultValue={editing?.first_name ?? ""} required maxLength={255}/></label>
                <label className="text-xs font-medium text-slate-600">Last name<input className={input} name="last_name" defaultValue={editing?.last_name ?? ""} required maxLength={255}/></label>
                <label className="text-xs font-medium text-slate-600">Middle name<input className={input} name="middle_name" defaultValue={editing?.middle_name ?? ""}/></label>
                <label className="text-xs font-medium text-slate-600">Section<select className="select select-bordered select-sm w-full" name="section_id" defaultValue={editing?.section_id ?? ""} required><option value="" disabled>Select section</option>{sections.map(section => <option key={section.id} value={section.id}>{section.year_level} – {section.section_name}</option>)}</select></label>
                <label className="text-xs font-medium text-slate-600">Gender<input className={input} name="gender" defaultValue={editing?.gender ?? ""} required maxLength={10}/></label>
                <label className="text-xs font-medium text-slate-600">Birth date<input className={input} name="birthdate" type="date" defaultValue={editing?.birthdate?.slice(0, 10) ?? ""} required/></label>
                <label className="text-xs font-medium text-slate-600">Guardian name<input className={input} name="gurdian_name" defaultValue={editing?.gurdian_name ?? ""} required maxLength={255}/></label>
                <label className="text-xs font-medium text-slate-600">Guardian contact<input className={input} name="gurdian_contact" defaultValue={editing?.gurdian_contact ?? ""} required maxLength={20}/></label>
                <label className="text-xs font-medium text-slate-600 sm:col-span-2">Address<input className={input} name="address" defaultValue={editing?.address ?? ""} required maxLength={255}/></label>
                <label className="text-xs font-medium text-slate-600">Status<select className="select select-bordered select-sm w-full" name="status" defaultValue={editing?.status ?? "active"}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                <div className="modal-action col-span-full mt-2"><button type="button" className="btn btn-sm" disabled={submitting} onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn btn-sm border-emerald-600 bg-emerald-600 text-white" disabled={submitting}>{submitting ? <><Loading size="xs" className="!text-white"/> Saving...</> : "Save Student"}</button></div>
            </form>
        </ManagementModal>
    </>;
}
