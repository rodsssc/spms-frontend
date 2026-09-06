import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "../../../@/components/ui/chart";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../../@/components/ui/card";

/* =========================================================
   TYPES
========================================================= */
interface StatCard {
    label: string;
    value: string;
    subtext: string;
    icon: string;
}

interface ProgressPoint {
    month: string;
    avgWpm: number;
}

interface PerformanceSlice {
    name: string;
    value: number;
    color: string;
}

interface StudentRow {
    name: string;
    studentId: string;
    section: string;
    assessment: string;
    score: string;
    date: string;
    status: "Proficient" | "Developing" | "Needs Support";
}

/* =========================================================
   MOCK DATA (static)
   TODO: replace with real aggregates once the API is wired up.
========================================================= */
const STAT_CARDS: StatCard[] = [
    { label: "Total Students", value: "482", subtext: "Across 12 sections", icon: "fa-solid fa-users" },
    { label: "Average WPM", value: "76", subtext: "+4 from last month", icon: "fa-solid fa-gauge-high" },
    { label: "Proficient Rate", value: "61%", subtext: "295 students", icon: "fa-solid fa-award" },
    { label: "Needs Support", value: "58", subtext: "12% of students", icon: "fa-solid fa-triangle-exclamation" },
];

const PROGRESS_TREND: ProgressPoint[] = [
    { month: "Mar", avgWpm: 58 },
    { month: "Apr", avgWpm: 63 },
    { month: "May", avgWpm: 65 },
    { month: "Jun", avgWpm: 69 },
    { month: "Jul", avgWpm: 72 },
    { month: "Aug", avgWpm: 76 },
];

const PERFORMANCE_BREAKDOWN: PerformanceSlice[] = [
    { name: "Proficient", value: 295, color: "#059669" },
    { name: "Developing", value: 129, color: "#f59e0b" },
    { name: "Needs Support", value: 58, color: "#ef4444" },
];

const STUDENT_ROWS: StudentRow[] = [
    {
        name: "Juan Dela Cruz",
        studentId: "STU-001",
        section: "Grade 3 - Rizal",
        assessment: "Reading Fluency",
        score: "85 WPM",
        date: "Aug 20, 2026",
        status: "Proficient",
    },
    {
        name: "Maria Santos",
        studentId: "STU-002",
        section: "Grade 3 - Rizal",
        assessment: "Reading Fluency",
        score: "72 WPM",
        date: "Aug 20, 2026",
        status: "Developing",
    },
    {
        name: "Pedro Garcia",
        studentId: "STU-003",
        section: "Grade 4 - Bonifacio",
        assessment: "Reading Comprehension",
        score: "88%",
        date: "Aug 19, 2026",
        status: "Proficient",
    },
    {
        name: "Ana Reyes",
        studentId: "STU-004",
        section: "Grade 4 - Bonifacio",
        assessment: "Reading Fluency",
        score: "58 WPM",
        date: "Aug 19, 2026",
        status: "Needs Support",
    },
];

/* =========================================================
   CHART CONFIGS
========================================================= */
const progressChartConfig = {
    avgWpm: {
        label: "Avg WPM",
        color: "#059669",
    },
} satisfies ChartConfig;

const performanceChartConfig = {
    Proficient: { label: "Proficient", color: "#059669" },
    Developing: { label: "Developing", color: "#f59e0b" },
    "Needs Support": { label: "Needs Support", color: "#ef4444" },
} satisfies ChartConfig;

/* =========================================================
   STATUS DISPLAY (Font Awesome only, no badges)
========================================================= */
const STATUS_STYLES: Record<StudentRow["status"], { icon: string; text: string }> = {
    Proficient: { icon: "fa-solid fa-circle-check", text: "text-emerald-600" },
    Developing: { icon: "fa-solid fa-triangle-exclamation", text: "text-amber-600" },
    "Needs Support": { icon: "fa-solid fa-circle-exclamation", text: "text-red-600" },
};

/* =========================================================
   PAGE
========================================================= */
export default function Dashboard() {
    return (
        <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-4 lg:p-2">
            <div className="mx-auto w-full max-w-7xl">

                {/* =====================================================
                    STAT CARDS
                ====================================================== */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {STAT_CARDS.map((stat) => (
                        <Card
                            key={stat.label}
                            className="gap-2 border-t-4 border-emerald-800 py-4 shadow-sm"
                        >
                            <CardContent className="flex items-start justify-between px-5">
                                <div>
                                    <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-800">{stat.value}</p>
                                    <p className="mt-1 text-xs text-slate-400">{stat.subtext}</p>
                                </div>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                                    <i className={`${stat.icon} text-emerald-700`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* =====================================================
                    STUDENT PROGRESS + READING PERFORMANCE
                ====================================================== */}
                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">

                    {/* Student Progress */}
                    <Card className="gap-4 border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-slate-700">
                                Student Progress
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Average reading speed (WPM) trend over the last 6 months
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <ChartContainer config={progressChartConfig} className="h-72 w-full">
                                <AreaChart
                                    data={PROGRESS_TREND}
                                    margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="fillAvgWpm" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-avgWpm)" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="var(--color-avgWpm)" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" />
                                    <YAxis allowDecimals={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Area
                                        type="monotone"
                                        dataKey="avgWpm"
                                        stroke="var(--color-avgWpm)"
                                        strokeWidth={2}
                                        fill="url(#fillAvgWpm)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Reading Performance */}
                    <Card className="gap-4 border-t-2 border-t-emerald-800 py-4 shadow-sm sm:py-5">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-slate-700">
                                Reading Performance
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Student distribution by proficiency level
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex flex-col items-center">
                            <ChartContainer config={performanceChartConfig} className="h-52 w-full">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Pie
                                        data={PERFORMANCE_BREAKDOWN}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={45}
                                        outerRadius={75}
                                        strokeWidth={2}
                                    >
                                        {PERFORMANCE_BREAKDOWN.map((slice) => (
                                            <Cell key={slice.name} fill={slice.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>

                            <div className="mt-2 w-full space-y-1.5">
                                {PERFORMANCE_BREAKDOWN.map((slice) => (
                                    <div key={slice.name} className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1.5 text-slate-600">
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{ backgroundColor: slice.color }}
                                            />
                                            {slice.name}
                                        </span>
                                        <span className="font-semibold text-slate-700">{slice.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* =====================================================
                    RECENT STUDENT PROGRESS TABLE
                ====================================================== */}
                <Card className="mt-5 gap-0 border-t-4 border-emerald-800 py-0 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                        <div>
                            <h2 className="text-base font-semibold text-slate-800">
                                Recent Student Progress
                            </h2>
                            <p className="text-xs text-slate-500">
                                Latest student assessment records
                            </p>
                        </div>

                        <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                            View All
                            <i className="fa-solid fa-arrow-right text-[10px]" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-xs text-slate-500">
                                    <th className="px-6 py-3 font-medium">Student</th>
                                    <th className="px-6 py-3 font-medium">Section</th>
                                    <th className="px-6 py-3 font-medium">Assessment</th>
                                    <th className="px-6 py-3 font-medium">Score</th>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {STUDENT_ROWS.map((student) => {
                                    const status = STATUS_STYLES[student.status];
                                    return (
                                        <tr
                                            key={student.studentId}
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-3">
                                                <p className="font-medium text-slate-700">{student.name}</p>
                                                <p className="text-xs text-slate-400">{student.studentId}</p>
                                            </td>
                                            <td className="px-6 py-3 text-slate-600">{student.section}</td>
                                            <td className="px-6 py-3 text-slate-600">{student.assessment}</td>
                                            <td className="px-6 py-3 font-medium text-slate-700">{student.score}</td>
                                            <td className="px-6 py-3 text-slate-600">{student.date}</td>
                                            <td className="px-6 py-3">
                                                <span className={`flex items-center gap-1.5 font-medium ${status.text}`}>
                                                    <i className={status.icon} />
                                                    {student.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

            </div>
        </div>
    );
}