import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../@/components/ui/chart";
import RadialProgress from "../../components/radial_progress";
import { getAssessments, type AdviserAssessment } from "../../services/adviser/assessment.services";
import { calculateStudentPerformance, getPerformanceColor, PERFORMANCE_LEVELS } from "../../services/adviser/performance";
import { getAllModules, type Module } from "../../services/adviser/module.services";
import { getAllSections, type Sections } from "../../services/adviser/section.services";
import { getAllStudents } from "../../services/adviser/student.services";

const activityConfig = {
    assessments: { label: "Assessments", color: "#047857" },
} satisfies ChartConfig;

const performanceConfig = {
    students: { label: "Students", color: "#047857" },
} satisfies ChartConfig;

export default function Dashboard() {
    const [modules, setModules] = useState<Module[]>([]);
    const [sections, setSections] = useState<Sections[]>([]);
    const [studentCount, setStudentCount] = useState(0);
    const [assessments, setAssessments] = useState<AdviserAssessment[]>([]);
    const [assessmentsLoading, setAssessmentsLoading] = useState(true);
    const [assessmentError, setAssessmentError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;
        Promise.all([getAllModules(), getAllSections(), getAllStudents({ per_page: 1 })])
            .then(([moduleData, sectionData, studentData]) => {
                if (!isMounted) return;
                setModules(moduleData);
                setSections(sectionData);
                setStudentCount(studentData.total);
            })
            .catch(() => isMounted && setError("Unable to load dashboard data."))
            .finally(() => isMounted && setIsLoading(false));
        getAssessments()
            .then((data) => isMounted && setAssessments(data))
            .catch(() => isMounted && setAssessmentError("Assessment activity is unavailable."))
            .finally(() => isMounted && setAssessmentsLoading(false));
        return () => { isMounted = false; };
    }, []);

    const scriptCount = modules.reduce((total, module) => total + (module.reading_scripts_count ?? 0), 0);

    const cards = [
        { label: "Students", value: studentCount, detail: "Students in your records" },
        { label: "Modules Added", value: modules.length, detail: "Modules you created" },
        { label: "Sections", value: sections.length, detail: "Available class sections" },
        { label: "Reading Scripts", value: scriptCount, detail: "Scripts across your modules" },
    ];

    const studentPerformance = useMemo(() => calculateStudentPerformance(assessments), [assessments]);
    const performanceDistribution = useMemo(() => PERFORMANCE_LEVELS.map((level) => ({
        level,
        students: studentPerformance.filter((student) => student.performanceLevel === level).length,
    })), [studentPerformance]);

    const assessmentActivity = useMemo(() => {
        const days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - (6 - index));
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            return { key, date, label: date.toLocaleDateString(undefined, { weekday: "short" }), assessments: 0 };
        });
        const byDay = new Map(days.map((day) => [day.key, day]));
        assessments.forEach((assessment) => {
            const date = new Date(assessment.created_at);
            if (Number.isNaN(date.getTime())) return;
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const day = byDay.get(key);
            if (day) day.assessments += 1;
        });
        return days;
    }, [assessments]);

    const moduleAccuracy = useMemo(() => {
        const groups = new Map<number, { module: string; sum: number; count: number; latest: number }>();
        assessments.forEach((assessment) => {
            const group = groups.get(assessment.module_id) ?? { module: assessment.module, sum: 0, count: 0, latest: 0 };
            group.sum += assessment.accuracy;
            group.count += 1;
            group.latest = Math.max(group.latest, new Date(assessment.created_at).getTime() || 0);
            groups.set(assessment.module_id, group);
        });
        return Array.from(groups.values())
            .sort((a, b) => b.latest - a.latest)
            .slice(0, 6)
            .map(({ module, sum, count }) => ({ module, accuracy: Math.round(sum / count), assessments: count }));
    }, [assessments]);

    return <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2"><div className="mx-auto w-full max-w-7xl">
        <div className="mb-5"><h1 className="text-2xl font-bold text-slate-800">Dashboard</h1><p className="mt-1 text-sm text-slate-500">A live overview of your students, modules, and sections.</p></div>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map((card) => <Card key={card.label} className="border-t-4 border-emerald-800 py-4 shadow-sm"><CardContent className="px-5"><p className="text-xs font-medium text-slate-500">{card.label}</p><p className="mt-1 text-2xl font-bold text-slate-800">{isLoading ? "—" : card.value}</p><p className="mt-1 text-xs text-slate-400">{card.detail}</p></CardContent></Card>)}</div>
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
            <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle className="text-base text-slate-700">Student Performance</CardTitle><CardDescription>Overview of student assessment performance based on their assessment results.</CardDescription></CardHeader><CardContent>{assessmentsLoading ? <div className="flex justify-center py-12"><span className="loading loading-spinner text-emerald-700" /></div> : assessmentError ? <p className="py-12 text-center text-sm text-slate-500">{assessmentError}</p> : studentPerformance.length === 0 ? <p className="py-12 text-center text-sm text-slate-500">No completed assessment results to summarize yet.</p> : <ChartContainer config={performanceConfig} className="h-64 w-full"><BarChart accessibilityLayer data={performanceDistribution} margin={{ left: 0, right: 12, bottom: 8 }}><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="level" tickLine={false} axisLine={false} tickMargin={8} interval={0} tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="students" radius={[5, 5, 0, 0]}>{performanceDistribution.map((item) => <Cell key={item.level} fill={getPerformanceColor(item.level)} />)}</Bar></BarChart></ChartContainer>}</CardContent></Card>
            <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle className="text-base text-slate-700">Recent Modules</CardTitle><CardDescription>Your latest module records.</CardDescription></CardHeader><CardContent>{isLoading ? <div className="flex justify-center py-6"><RadialProgress value={55} size="sm" label="" /></div> : modules.length ? <div className="space-y-3">{modules.slice(0, 4).map((module) => <div key={module.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"><p className="text-sm font-medium text-slate-700">{module.title}</p><p className="text-xs text-slate-500">{module.year_level} · {module.reading_scripts_count ?? 0} scripts</p></div>)}</div> : <p className="py-6 text-sm text-slate-500">No modules added yet.</p>}</CardContent></Card>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle className="text-base text-slate-700">Assessment Activity</CardTitle><CardDescription>Submitted reading assessments over the last seven days.</CardDescription></CardHeader><CardContent>{assessmentsLoading ? <div className="flex justify-center py-12"><span className="loading loading-spinner text-emerald-700" /></div> : assessmentError ? <p className="py-12 text-center text-sm text-slate-500">{assessmentError}</p> : assessments.length === 0 ? <p className="py-12 text-center text-sm text-slate-500">No assessment results have been submitted yet.</p> : <ChartContainer config={activityConfig} className="h-64 w-full"><BarChart accessibilityLayer data={assessmentActivity} margin={{ left: 0, right: 12, bottom: 4 }}><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="assessments" fill="var(--color-assessments)" radius={[5, 5, 0, 0]} /></BarChart></ChartContainer>}</CardContent></Card>
            <Card className="border-t-2 border-t-emerald-800 shadow-sm"><CardHeader><CardTitle className="text-base text-slate-700">Average Accuracy by Module</CardTitle><CardDescription>Mean score from submitted assessment results, for recently active modules.</CardDescription></CardHeader><CardContent>{assessmentsLoading ? <div className="flex justify-center py-12"><span className="loading loading-spinner text-emerald-700" /></div> : assessmentError ? <p className="py-12 text-center text-sm text-slate-500">{assessmentError}</p> : moduleAccuracy.length === 0 ? <p className="py-12 text-center text-sm text-slate-500">No assessment results to summarize yet.</p> : <ChartContainer config={{ accuracy: { label: "Average accuracy", color: "#10b981" } }} className="h-64 w-full"><BarChart accessibilityLayer data={moduleAccuracy} layout="vertical" margin={{ left: 8, right: 16 }}><CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="module" tickLine={false} axisLine={false} width={100} /><ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}%`} />} /><Bar dataKey="accuracy" fill="var(--color-accuracy)" radius={[0, 5, 5, 0]} /></BarChart></ChartContainer>}</CardContent></Card>
        </div>
    </div></div>;
}
