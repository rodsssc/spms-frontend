import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../@/components/ui/card";
import RadialProgress from "../../components/radial_progress";
import { getAssignedModules, getStudent } from "../../services/student/auth.services";

interface StudentData { first_name: string; }
interface Script { id: number; title: string; status: "pending" | "completed" | "non-compliant"; }
interface ModuleData { id: number; title: string; description: string | null; reading_scripts: Script[]; }

const progressChartConfig = { progress: { label: "Progress", color: "#059669" } } satisfies ChartConfig;

export default function Dashboard() {
    const navigate = useNavigate();
    const [student, setStudent] = useState<StudentData | null>(null);
    const [modules, setModules] = useState<ModuleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        Promise.all([getStudent(), getAssignedModules()])
            .then(([studentResponse, modulesResponse]) => {
                if (!isMounted) return;
                setStudent(studentResponse.data.student);
                setModules(modulesResponse.data.modules ?? []);
            })
            .catch(() => isMounted && setError("Unable to load your dashboard."))
            .finally(() => isMounted && setIsLoading(false));

        return () => { isMounted = false; };
    }, []);

    const summary = useMemo(() => {
        const scripts = modules.flatMap((module) => module.reading_scripts ?? []);
        const completed = scripts.filter((script) => script.status === "completed").length;
        const pending = scripts.filter((script) => script.status === "pending").length;
        const progress = scripts.length ? Math.round((completed / scripts.length) * 100) : 0;
        const chartData = modules.map((module) => {
            const moduleScripts = module.reading_scripts ?? [];
            const moduleCompleted = moduleScripts.filter((script) => script.status === "completed").length;
            return { module: module.title, progress: moduleScripts.length ? Math.round((moduleCompleted / moduleScripts.length) * 100) : 0 };
        });
        const nextModule = modules.find((module) => module.reading_scripts?.some((script) => script.status !== "completed"));
        return { scripts, completed, pending, progress, chartData, nextModule };
    }, [modules]);

    const stats = [
        { label: "Assigned Modules", value: modules.length, subtext: "Modules assigned to your section", icon: "fa-solid fa-book-open" },
        { label: "Completed Scripts", value: summary.completed, subtext: "Scripts marked completed", icon: "fa-solid fa-circle-check" },
        { label: "Pending Scripts", value: summary.pending, subtext: "Scripts awaiting completion", icon: "fa-solid fa-clock" },
        { label: "Overall Progress", value: `${summary.progress}%`, subtext: "Across assigned scripts", icon: "fa-solid fa-chart-line" },
    ];

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2">
            <div className="mx-auto w-full max-w-7xl">
                <div className="mb-5"><h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">{isLoading ? "Welcome back..." : `Welcome back, ${student?.first_name ?? "Student"}`}</h1><p className="mt-1 text-sm text-slate-500">Track the modules and reading scripts assigned to you.</p></div>

                {error && <Card className="mb-5 border-red-200"><CardContent className="py-4 text-sm text-red-600">{error}</CardContent></Card>}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => <Card key={stat.label} className="gap-2 border-t-4 border-emerald-800 py-4 shadow-sm"><CardContent className="flex items-start justify-between px-5"><div><p className="text-xs font-medium text-slate-500">{stat.label}</p><p className="mt-1 text-2xl font-bold text-slate-800">{isLoading ? "—" : stat.value}</p><p className="mt-1 text-xs text-slate-400">{stat.subtext}</p></div><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50"><i className={`${stat.icon} text-emerald-700`} /></div></CardContent></Card>)}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">
                    <Card className="gap-4 border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5"><CardHeader><CardTitle className="text-sm font-semibold text-slate-700">My Learning Progress</CardTitle><CardDescription className="text-xs">Completion progress by assigned module.</CardDescription></CardHeader><CardContent>{summary.chartData.length ? <ChartContainer config={progressChartConfig} className="h-72 w-full"><AreaChart data={summary.chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}><defs><linearGradient id="fillProgress" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-progress)" stopOpacity={0.35} /><stop offset="95%" stopColor="var(--color-progress)" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="module" hide /><YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} /><ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}%`} />} /><Area type="monotone" dataKey="progress" stroke="var(--color-progress)" strokeWidth={2} fill="url(#fillProgress)" /></AreaChart></ChartContainer> : <p className="py-24 text-center text-sm text-slate-500">No assigned modules to show yet.</p>}</CardContent></Card>

                    <Card className="gap-4 border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5"><CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Continue Learning</CardTitle><CardDescription className="text-xs">Your next assigned module.</CardDescription></CardHeader><CardContent>{isLoading ? <div className="flex justify-center py-8"><RadialProgress value={55} size="md" label="" /></div> : summary.nextModule ? <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-700">{summary.nextModule.title}</p>{summary.nextModule.description && <p className="mt-1 text-xs leading-5 text-slate-500">{summary.nextModule.description}</p>}</div><RadialProgress value={summary.progress} size="sm" /></div><button type="button" onClick={() => navigate("/student/module")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800">View Module<i className="fa-solid fa-arrow-right text-[10px]" /></button></div> : <p className="py-8 text-sm text-slate-500">No pending scripts right now.</p>}</CardContent></Card>
                </div>
            </div>
        </div>
    );
}
