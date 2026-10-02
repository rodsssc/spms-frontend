import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Loading from "../../components/loading";
import ListPagination from "../../components/superadmin/listPagination";
import ManagementModal from "../../components/superadmin/managementModal";
import PageLoading from "../../components/superadmin/pageLoading";
import { errorMessage, showToast } from "../../services/superadmin/common.services";
import type { Adviser } from "../../services/superadmin/common.services";
import { getAdvisers, saveAdviser } from "../../services/superadmin/adviser.services";
import type { Paginated } from "../../services/superadmin/common.services";

const input = "input input-bordered input-sm w-full focus:border-emerald-500 focus:outline-none";

export default function SuperAdminAdvisers() {
    const [result, setResult] = useState<Paginated<Adviser> | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Adviser | null>(null);

    const load = async () => {
        setLoading(true);
        try { setResult(await getAdvisers({ search: query || undefined, page, per_page: perPage })); }
        catch (error) { await showToast("error", "Unable to load advisers", errorMessage(error)); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [query, page, perPage]);

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
        if (editing && !data.password) delete data.password;
        setSubmitting(true);
        try { await saveAdviser(data, editing?.id); setOpen(false); await load(); await showToast("success", editing ? "Adviser updated" : "Adviser added"); }
        catch (error) { await showToast("error", "Unable to save adviser", String(errorMessage(error))); }
        finally { setSubmitting(false); }
    };

    const launch = (adviser: Adviser | null = null) => { setEditing(adviser); setOpen(true); };

    return <>
        {loading ? <PageLoading label="Loading advisers..."/> : <section className="overflow-hidden rounded-xl border-t-4 border-emerald-800 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="text-lg font-semibold text-slate-800">Adviser Records</h2><p className="mt-0.5 text-sm text-slate-500">Onboard and update adviser accounts</p></div><button className="btn btn-sm border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => launch()}><i className="fa-solid fa-plus"/> Add Adviser</button></div>
            <form className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row" onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search.trim()); }}><input className={input} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search adviser name or email"/><select className="select select-bordered select-sm sm:w-36" value={perPage} onChange={event => { setPerPage(Number(event.target.value)); setPage(1); }}><option value={10}>10 per page</option><option value={25}>25 per page</option><option value={50}>50 per page</option></select><button className="btn btn-sm border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"><i className="fa-solid fa-magnifying-glass"/> Search</button></form>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3 text-center">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{result?.data.map(adviser => <tr key={adviser.id}><td className="px-4 py-3 font-medium text-slate-700">{adviser.name}</td><td className="px-4 py-3 text-slate-600">{adviser.email}</td><td className="px-4 py-3 text-center"><button className="btn btn-ghost btn-sm text-emerald-700" onClick={() => launch(adviser)}><i className="fa-solid fa-pen"/> Edit</button></td></tr>)}{result?.data.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No advisers found.</td></tr>}</tbody></table></div>
            {result && <ListPagination page={result.current_page} lastPage={result.last_page} total={result.total} perPage={result.per_page} onChange={setPage}/>}
        </section>}
        <ManagementModal open={open} title={`${editing ? "Edit" : "Add"} Adviser`} description="Enter the adviser account information below." onClose={() => setOpen(false)}>
            <form key={editing?.id ?? "new-adviser"} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={save}>
                <label className="text-xs font-medium text-slate-600">Full name<input className={input} name="name" defaultValue={editing?.name ?? ""} required maxLength={255}/></label>
                <label className="text-xs font-medium text-slate-600">Email<input className={input} name="email" type="email" defaultValue={editing?.email ?? ""} required maxLength={255}/></label>
                <label className="text-xs font-medium text-slate-600 sm:col-span-2">{editing ? "New password (optional)" : "Temporary password"}<input className={input} name="password" type="password" minLength={8} required={!editing} autoComplete="new-password"/></label>
                <div className="modal-action col-span-full mt-2"><button type="button" className="btn btn-sm" disabled={submitting} onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn btn-sm border-emerald-600 bg-emerald-600 text-white" disabled={submitting}>{submitting ? <><Loading size="xs" className="!text-white"/> Saving...</> : "Save Adviser"}</button></div>
            </form>
        </ManagementModal>
    </>;
}
