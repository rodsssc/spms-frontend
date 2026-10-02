import RadialProgress from "../radial_progress";

export default function PageLoading({ label = "Loading records..." }: { label?: string }) {
    return <div className="rounded-xl border-t-4 border-emerald-800 bg-white p-10 shadow-sm"><div className="flex flex-col items-center gap-2"><RadialProgress value={60} size="md" tone="emerald" showValue={false}/><p className="text-sm text-slate-500">{label}</p></div></div>;
}
