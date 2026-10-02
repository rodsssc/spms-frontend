
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, login } from "../../services/adviser/auth.services";
import loginBackground from "../../assets/images/spms-login-bg.png";

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            await login(email, password);

            const { data: user } = await getUser();
            navigate(user.role === "superadmin" ? "/superadmin/dashboard" : "/adviser/dashboard");
        } catch (err: any) {
            if (err.response?.status === 422) {
                setError("Invalid email or password.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] bg-white">

            {/* LEFT BRANDING PANEL */}
            <div
                className="relative hidden min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat lg:flex lg:flex-col lg:justify-center p-20"
                style={{
                    backgroundImage: `url(${loginBackground})`,
                }}
            >
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-emerald-950/95 via-emerald-700/80 to-emerald-700/10" />

                <div className="relative z-10 max-w-[560px] text-white">
                    <h1 className="mb-5 text-[clamp(2.2rem,4vw,4rem)] font-bold leading-[1.08] tracking-tight">
                        Student Progress
                        <br />
                        Monitoring System
                    </h1>

                    <p className="max-w-[480px] text-[1.05rem] leading-[1.7] text-white/85">
                        A centralized platform for monitoring,
                        managing, and improving student learning
                        progress.
                    </p>
                </div>

                <div className="absolute bottom-8 left-20 right-20 z-10 flex items-center gap-2.5 text-xs text-white/70">
                    <span>SPMS</span>
                    <span>•</span>
                    <span>
                        Student Progress Monitoring System
                    </span>
                </div>
            </div>

            {/* RIGHT LOGIN PANEL */}
            <div className="flex min-h-screen items-center justify-center bg-white px-5 py-8 sm:px-8 lg:px-16">

                <div className="w-full max-w-[440px]">

                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="mb-2 text-3xl font-bold text-slate-800 sm:text-[2rem]">
                            Welcome Back
                        </h1>

                        <p className="text-sm text-slate-500">
                            Sign in to your account to continue
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

                        {/* Email */}
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="email"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Email Address
                            </label>

                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                                className="input input-bordered w-full rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/10"
                            />
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Password
                            </label>

                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                className="input input-bordered w-full rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/10"
                            />
                        </div>

                        {/* Remember / Forgot */}
                        <div className="flex flex-col gap-3 text-sm min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">

                            <label
                                htmlFor="remember"
                                className="flex cursor-pointer items-center gap-2 text-slate-500"
                            >
                                <input
                                    type="checkbox"
                                    id="remember"
                                    className="checkbox checkbox-sm checkbox-success"
                                />

                                <span>
                                    Remember me
                                </span>
                            </label>

                            <a
                                href="#"
                                className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                                onClick={(e) => e.preventDefault()}
                            >
                                Forgot Password?
                            </a>
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
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Portal Links */}
                    <div className="mt-8 border-t border-slate-200 pt-6 text-center">
                        <div className="mt-4">
                            <a
                                href="/student/login"
                                className="text-sm font-semibold text-slate-600 hover:text-emerald-700 hover:underline"
                            >
                                Student Portal Login →
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

