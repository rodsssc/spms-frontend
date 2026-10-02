import { useState } from "react";
import { useNavigate } from "react-router-dom";

import loginBackground from "../../assets/images/spms-login-bg.png";
import Loading from "../../components/loading";

import { login } from "../../services/student/auth.services";

export default function Login() {
    const navigate = useNavigate();

    const [studentCode, setStudentCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            await login(studentCode);

            navigate("/student/dashboard");

        } catch (err: any) {
            if (err.response?.status === 422) {
                setError("Please enter your student code.");
            } else if (err.response?.status === 401) {
                setError("Invalid student code.");
            } else {
                setError(
                    "Something went wrong. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] bg-white">

            {/* =========================================
                LEFT BRANDING PANEL
            ========================================= */}
            <div
                className="relative hidden min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat lg:flex lg:flex-col lg:justify-center p-20"
                style={{
                    backgroundImage: `url(${loginBackground})`,
                }}
            >

                {/* Green Overlay */}
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-emerald-950/95 via-emerald-700/80 to-emerald-700/10" />

                {/* Branding Content */}
                <div className="relative z-10 max-w-[560px] text-white">

                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                            <i className="fa-solid fa-graduation-cap text-lg" />
                        </div>

                        <span className="text-sm font-semibold tracking-wide text-emerald-100">
                            STUDENT PORTAL
                        </span>
                    </div>

                    <h1 className="mb-5 text-[clamp(2.2rem,4vw,4rem)] font-bold leading-[1.08] tracking-tight">
                        Student Progress
                        <br />
                        Monitoring System
                    </h1>

                    <p className="max-w-[480px] text-[1.05rem] leading-[1.7] text-white/85">
                        Access your assigned learning modules,
                        complete activities, and keep track of
                        your learning progress.
                    </p>
                </div>

                {/* Branding Footer */}
                <div className="absolute bottom-8 left-20 right-20 z-10 flex items-center gap-2.5 text-xs text-white/70">
                    <span>SPMS</span>
                    <span>•</span>
                    <span>
                        Student Progress Monitoring System
                    </span>
                </div>
            </div>


            {/* =========================================
                RIGHT LOGIN PANEL
            ========================================= */}
            <div className="flex min-h-screen items-center justify-center bg-white px-5 py-8 sm:px-8 lg:px-16">

                <div className="w-full max-w-[440px]">

                    {/* Header */}
                    <div className="mb-10">

                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 lg:hidden">
                            <i className="fa-solid fa-graduation-cap text-lg" />
                        </div>

                        <h1 className="mb-2 text-3xl font-bold text-slate-800 sm:text-[2rem]">
                            Student Login
                        </h1>

                        <p className="text-sm text-slate-500">
                            Enter your Student Code to access your portal.
                        </p>
                    </div>


                    {/* Login Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-5"
                    >

                        {/* Error */}
                        {error && (
                            <div
                                role="alert"
                                className="alert alert-error text-sm"
                            >
                                <span>{error}</span>
                            </div>
                        )}


                        {/* Student Code */}
                        <div className="flex flex-col gap-2">

                            <label
                                htmlFor="studentCode"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Student Code
                            </label>

                            <input
                                type="text"
                                id="studentCode"
                                value={studentCode}
                                onChange={(e) =>
                                    setStudentCode(e.target.value)
                                }
                                placeholder="Enter your Student Code"
                                autoComplete="username"
                                required
                                disabled={loading}
                                className="input input-bordered w-full rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/10 disabled:bg-slate-50"
                            />

                        </div>


                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn mt-2 min-h-[50px] w-full rounded-lg border-0 bg-emerald-700 text-sm font-semibold text-white shadow-none hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-700/20 disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <span
                                        className="loading loading-spinner loading-sm"
                                        aria-hidden="true"
                                    />

                                    <span>
                                        Signing In...
                                    </span>
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-right-to-bracket" />

                                    <span>
                                        Sign In
                                    </span>
                                </>
                            )}
                        </button>

                    </form>


                    
                    {/* Footer */}
                    <div className="mt-8 border-t border-slate-200 pt-6 text-center">

                        <p className="text-xs text-slate-400">
                            Student access is provided by your school
                            administrator or adviser.
                        </p>

                        <div className="mt-4">
                            <a
                                href="/login"
                                className="text-sm font-semibold text-slate-600 hover:text-emerald-700 hover:underline"
                            >
                                Adviser Portal Login →
                            </a>
                        </div>

                    </div>


                </div>

            </div>

        </div>
    );
}