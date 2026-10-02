import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/navbar/adviser/header";
import SuperAdminSidebar from "../components/navbar/superadmin/sidebar";

export default function SuperAdminLayout() {
    const [collapsed, setCollapsed] = useState(false);

    return <div className="min-h-screen bg-slate-100">
        <SuperAdminSidebar collapsed={collapsed} setCollapsed={setCollapsed}/>
        <main className={`min-h-screen transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
            <Header/>
            <div className="p-3 sm:p-4 lg:p-6"><div className="mx-auto w-full max-w-7xl"><Outlet/></div></div>
        </main>
    </div>;
}
