import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../@/components/ui/chart";
import Swal from "sweetalert2";
import api from "../../config/axios";
import PageLoading from "../../components/superadmin/pageLoading";

type Stats = { advisers: number; students: number; sections: number; assigned_sections: number; unassigned_sections: number };

const totalsConfig = {
    advisers: { label: "Advisers", color: "#047857" },
    students: { label: "Students", color: "#10b981" },
    sections: { label: "Sections", color: "#6ee7b7" },
} satisfies ChartConfig;

const assignmentConfig = {
    assigned: { label: "Assigned", color: "#047857" },
    unassigned: { label: "Unassigned", color: "#cbd5e1" },
} satisfies ChartConfig;

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        api.get<Stats>("/api/superadmin/dashboard").then(response => {
            if (isMounted) setStats(response.data);
        }).catch(error => {
            if (!isMounted) return;
            setError(true);
            void Swal.fire({ icon: "error", title: "Unable to load dashboard", text: error.response?.data?.message || "Please try again later." });
        }).finally(() => isMounted && setLoading(false));
        return () => { isMounted = false; };
    }, []);

    const totals = useMemo(() => stats ? [
        { name: "Advisers", total: stats.advisers },
        { name: "Students", total: stats.students },
        { name: "Sections", total: stats.sections },
    ] : [], [stats]);
    const assignments = useMemo(() => stats ? [
        { name: "Assigned", value: stats.assigned_sections, fill: "var(--color-assigned)" },
        { name: "Unassigned", value: stats.unassigned_sections, fill: "var(--color-unassigned)" },
    ] : [], [stats]);
    const cards = [
        ["Total Advisers", stats?.advisers], ["Total Students", stats?.students], ["Total Sections", stats?.sections],
        ["Assigned Sections", stats?.assigned_sections], ["Unassigned Sections", stats?.unassigned_sections],
    ] as const;

    if (loading) return <PageLoading label="Loading system overview..." />;

    return <section className="space-y-5">
        <div><h1 className="text-2xl font-bold text-slate-800">System Overview</h1><p className="mt-1 text-sm text-slate-500">A live summary of SPMS users and section assignments.</p></div>
        {error && !stats ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Dashboard data is unavailable. Please refresh to try again.</p> : <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value]) => <Card key={label} className="border-t-4 border-emerald-800 py-4 shadow-sm"><CardContent className="px-5"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-800">{value ?? 0}</p></CardContent></Card>)}</div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[3fr_2fr]">
                <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle className="text-base text-slate-700">System Totals</CardTitle><CardDescription>Current adviser, student, and section counts.</CardDescription></CardHeader><CardContent>{totals.length ? <ChartContainer config={totalsConfig} className="h-64 w-full"><BarChart accessibilityLayer data={totals} margin={{ left: 4, right: 12 }}><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="total" fill="var(--color-advisers)" radius={[5, 5, 0, 0]} /></BarChart></ChartContainer> : <p className="py-24 text-center text-sm text-slate-500">No system totals to display.</p>}</CardContent></Card>
                <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle className="text-base text-slate-700">Section Assignments</CardTitle><CardDescription>Sections with and without an assigned adviser.</CardDescription></CardHeader><CardContent>{(stats?.sections ?? 0) > 0 ? <ChartContainer config={assignmentConfig} className="mx-auto h-64 w-full max-w-sm"><PieChart><ChartTooltip content={<ChartTooltipContent nameKey="name" />} /><Pie data={assignments} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3} /></PieChart></ChartContainer> : <p className="py-24 text-center text-sm text-slate-500">No sections to display yet.</p>}</CardContent></Card>
            </div>
        </>}
    </section>;
}
