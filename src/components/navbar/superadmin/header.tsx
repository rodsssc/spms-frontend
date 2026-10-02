import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../services/adviser/auth.services";

export default function SuperAdminHeader() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => setCurrentDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await logout();
            navigate("/login");
        } finally {
            setLoggingOut(false);
        }
    };

    return <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 lg:px-6">
        <div className="min-w-0"><h1 className="truncate text-base font-bold tracking-tight text-slate-800 sm:text-lg">SPMS</h1><p className="hidden text-xs text-emerald-600 sm:block">Super Admin Management</p></div>
        <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-right"><p className="text-xs font-semibold text-slate-700 sm:text-sm">{currentDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p><p className="hidden text-xs text-slate-500 md:block">{currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p></div>
            <button type="button" onClick={handleLogout} disabled={loggingOut} className="btn btn-sm text-red-600 hover:bg-red-50">{loggingOut ? <><span className="loading loading-spinner loading-xs"/> Logging out...</> : <><i className="fa-solid fa-right-from-bracket"/> Log out</>}</button>
        </div>
    </header>;
}
