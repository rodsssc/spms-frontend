type ListPaginationProps = {
    page: number;
    lastPage: number;
    total: number;
    perPage: number;
    onChange: (page: number) => void;
};

export default function ListPagination({ page, lastPage, total, perPage, onChange }: ListPaginationProps) {
    if (total === 0) return null;
    const first = (page - 1) * perPage + 1;
    const last = Math.min(page * perPage, total);
    return <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs text-slate-500 sm:text-sm">Showing <span className="font-medium text-slate-700">{first}–{last}</span> of <span className="font-medium text-slate-700">{total}</span> records</p>
        <div className="flex items-center gap-1">
            <button type="button" className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}><i className="fa-solid fa-chevron-left"/> Previous</button>
            <span className="px-2 text-xs text-slate-500">Page {page} of {lastPage}</span>
            <button type="button" className="btn btn-sm btn-ghost" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>Next <i className="fa-solid fa-chevron-right"/></button>
        </div>
    </div>;
}
