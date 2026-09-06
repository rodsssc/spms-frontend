import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../services/adviser/auth.services";

export default function Header() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const date = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const time = currentDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);

            await logout();

            // Redirect to login page
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 lg:px-6">

            {/* Left Side - Brand */}
            <div className="min-w-0">
                <h1 className="truncate text-base font-bold tracking-tight text-slate-800 sm:text-lg">
                    SPMS
                </h1>

                <p className="hidden truncate text-xs text-emerald-500 sm:block">
                    Monitor student progress and reading performance
                </p>
            </div>

            {/* Right Side */}
            <div className="flex shrink-0 items-center gap-3 sm:gap-5 lg:gap-8">

                {/* Date & Time */}
                <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700 sm:text-sm">
                        {time}
                    </p>

                    <p className="hidden text-xs text-slate-500 md:block">
                        {date}
                    </p>
                </div>

                {/* Avatar Dropdown */}
                <div className="dropdown dropdown-end">
                    {/* Avatar Button */}
                    <div
                        tabIndex={0}
                        role="button"
                        className="avatar cursor-pointer"
                    >
                        <div className="w-9 rounded-full ring-2 ring-emerald-500 ring-offset-2 ring-offset-white transition hover:ring-emerald-600 sm:w-10 lg:w-11">
                            <img
                                alt="User profile"
                                src="https://img.daisyui.com/images/profile/demo/spiderperson@192.webp"
                            />
                        </div>
                    </div>

                    {/* Dropdown Menu */}
                    <ul
                        tabIndex={0}
                        className="dropdown-content menu z-[1] mt-3 w-56 rounded-box border border-slate-200 bg-white p-2 shadow-lg"
                    >
                        {/* User Information */}
                        <li className="pointer-events-none mb-1">
                            <div className="flex flex-col items-start gap-0 px-3 py-2">
                                <span className="text-sm font-semibold text-slate-800">
                                    User
                                </span>

                                <span className="text-xs text-slate-500">
                                    SPMS Account
                                </span>
                            </div>
                        </li>

                        <div className="my-1 border-t border-slate-200" />

                        {/* Logout */}
                        <li>
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs" />
                                        Logging out...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="h-5 w-5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3H9m0 0l3-3m-3 3l3 3"
                                            />
                                        </svg>

                                        Logout
                                    </>
                                )}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
}