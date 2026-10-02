import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../../@/components/ui/card";
import { getAssignedModules } from "../../services/student/auth.services";

type ScriptStatus = "pending" | "completed" | "non-compliant";

interface Script {
    id: number;
    title: string;
    due_date: string | null;
    status: ScriptStatus;
}

interface ModuleData {
    id: number;
    title: string;
    description: string | null;
    reading_scripts: Script[];
}

const statusStyle: Record<ScriptStatus, { label: string; badge: string; icon: string }> = {
    completed: { label: "Completed", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: "fa-solid fa-circle-check" },
    pending: { label: "Pending", badge: "bg-amber-50 text-amber-700 border border-amber-200", icon: "fa-solid fa-clock" },
    "non-compliant": { label: "Non-compliant", badge: "bg-slate-100 text-slate-600 border border-slate-200", icon: "fa-solid fa-circle-exclamation" },
};

const formatDate = (date: string | null) =>
    date ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T00:00:00`)) : "No due date";

export default function Module() {
    const navigate = useNavigate();
    const [modules, setModules] = useState<ModuleData[]>([]);
    const [openModule, setOpenModule] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        getAssignedModules()
            .then((response) => {
                if (!isMounted) return;
                const assignedModules = response.data.modules ?? [];
                setModules(assignedModules);
                setOpenModule(assignedModules[0]?.id ?? null);
            })
            .catch(() => isMounted && setError("Unable to load your assigned modules."))
            .finally(() => isMounted && setIsLoading(false));

        return () => { isMounted = false; };
    }, []);

    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-6">
            <div className="mx-auto w-full max-w-7xl">
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl lg:text-3xl">My Modules</h1>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">View the modules and reading scripts assigned to your section.</p>
                </div>

                <Card className="gap-0 border-t-4 border-emerald-800 py-0 shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                        <h2 className="text-sm font-semibold text-slate-800 sm:text-base">Assigned Modules</h2>
                    </div>

                    {isLoading && <p className="px-6 py-8 text-sm text-slate-500">Loading modules...</p>}
                    {error && <p className="px-6 py-8 text-sm text-red-600">{error}</p>}
                    {!isLoading && !error && modules.length === 0 && <p className="px-6 py-8 text-sm text-slate-500">No modules are assigned to your section yet.</p>}

                    <div className="divide-y divide-slate-200">
                        {modules.map((module) => {
                            const scripts = module.reading_scripts ?? [];
                            const completed = scripts.filter((script) => script.status === "completed").length;
                            const progress = scripts.length ? Math.round((completed / scripts.length) * 100) : 0;
                            const isOpen = openModule === module.id;

                            return (
                                <div key={module.id}>
                                    <button type="button" onClick={() => setOpenModule(isOpen ? null : module.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 sm:gap-4 sm:px-6 sm:py-4">
                                        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 sm:h-10 sm:w-10"><i className="fa-solid fa-book text-sm text-emerald-700 sm:text-base" /></div>
                                            <div className="min-w-0">
                                                <h3 className="truncate text-xs font-semibold text-slate-700 sm:text-sm">{module.title}</h3>
                                                {module.description && <p className="mt-0.5 hidden truncate text-xs text-slate-400 sm:block">{module.description}</p>}
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2 sm:gap-4"><span className="text-xs font-semibold text-emerald-700">{progress}%</span><i className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} /></div>
                                    </button>

                                    {isOpen && <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-3 sm:px-6">
                                        {scripts.length === 0 ? <p className="px-1 py-2 text-xs text-slate-500">No scripts have been added to this module yet.</p> :
                                            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                                                {scripts.map((script) => {
                                                    const status = statusStyle[script.status] ?? statusStyle.pending;
                                                    return <div key={script.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                                                        <div className="flex min-w-0 items-center gap-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100"><i className="fa-solid fa-file-lines text-xs text-slate-500" /></div><div className="min-w-0"><p className="truncate text-xs font-medium text-slate-600">{script.title}</p><p className="mt-0.5 text-[11px] text-slate-400"><i className="fa-regular fa-calendar mr-1" />{formatDate(script.due_date)}</p></div></div>
                                                        <div className="flex items-center gap-2"><span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${status.badge}`}><i className={status.icon} />{status.label}</span>{script.status !== "completed" && <button type="button" onClick={() => navigate(`/student/assessment/${module.id}/${script.id}`)} className="rounded-lg border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50">Proceed</button>}</div>
                                                    </div>;
                                                })}
                                            </div>}
                                    </div>}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}
