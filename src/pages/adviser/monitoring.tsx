import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../@/components/ui/card";
import RadialProgress from "../../components/radial_progress";

const moduleProgress = [
    { module: "Reading Basics", completed: 18, pending: 7 },
    { module: "Vocabulary", completed: 14, pending: 11 },
    { module: "Comprehension", completed: 9, pending: 16 },
];

const chartConfig = {
    completed: { label: "Completed", color: "#059669" },
    pending: { label: "Pending", color: "#cbd5e1" },
} satisfies ChartConfig;

export default function Monitoring() {
    const completed = moduleProgress.reduce((total, module) => total + module.completed, 0);
    const total = moduleProgress.reduce((sum, module) => sum + module.completed + module.pending, 0);
    const progress = Math.round((completed / total) * 100);

    return <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2"><div className="mx-auto w-full max-w-7xl">
        <div className="mb-5"><h1 className="text-2xl font-bold text-slate-800">Monitoring</h1><p className="mt-1 text-sm text-slate-500">Static project preview of student reading-script completion by module.</p></div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
            <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle className="text-base text-slate-700">Overall Completion</CardTitle><CardDescription>Sample progress while live monitoring is being prepared.</CardDescription></CardHeader><CardContent className="flex flex-col items-center gap-4 sm:flex-row"><RadialProgress value={progress} size="lg" /><div><p className="text-sm font-semibold text-slate-700">{completed} of {total} reading records completed</p><p className="mt-1 text-sm text-slate-500">This view is static and is limited to the current project’s modules and scripts.</p></div></CardContent></Card>
            <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle className="text-base text-slate-700">Completion by Module</CardTitle><CardDescription>Static sample data for the adviser monitoring layout.</CardDescription></CardHeader><CardContent><ChartContainer config={chartConfig} className="h-56 w-full"><BarChart data={moduleProgress}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="module" /><YAxis allowDecimals={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="completed" stackId="progress" fill="var(--color-completed)" /><Bar dataKey="pending" stackId="progress" fill="var(--color-pending)" /></BarChart></ChartContainer></CardContent></Card>
        </div>
        <Card className="mt-5 border-t-4 border-emerald-800 shadow-sm"><CardHeader><CardTitle className="text-base text-slate-700">Module Snapshot</CardTitle><CardDescription>Use this as the adviser’s high-level reading-script follow-up view.</CardDescription></CardHeader><CardContent><div className="divide-y divide-slate-100">{moduleProgress.map((module) => { const value = Math.round((module.completed / (module.completed + module.pending)) * 100); return <div key={module.module} className="flex items-center justify-between py-3"><div><p className="text-sm font-medium text-slate-700">{module.module}</p><p className="text-xs text-slate-500">{module.completed} completed · {module.pending} pending</p></div><RadialProgress value={value} size="sm" /></div>; })}</div></CardContent></Card>
    </div></div>;
}
