import { NavLink } from "react-router-dom";

type SuperAdminSidebarProps = {
    collapsed: boolean;
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

const links = [
    { id: "dashboard", label: "Dashboard", icon: "fa-chart-line" },
    { id: "advisers", label: "Advisers", icon: "fa-user-tie" },
    { id: "students", label: "Students", icon: "fa-user-graduate" },
    { id: "sections", label: "Sections", icon: "fa-users-rectangle" },
];

export default function SuperAdminSidebar({ collapsed, setCollapsed }: SuperAdminSidebarProps) {
    return <aside className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-emerald-900/60 bg-emerald-950 text-slate-200 transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}>
        <div className={`flex h-16 items-center border-b border-emerald-900/60 ${collapsed ? "justify-center px-3" : "justify-between px-5"}`}>
            {!collapsed && <div className="whitespace-nowrap"><h1 className="text-sm font-bold tracking-wide text-white">SPMS</h1><p className="text-[11px] text-emerald-300/60">Super Admin</p></div>}
            <button type="button" onClick={() => setCollapsed(value => !value)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white transition-colors hover:bg-emerald-700" title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                <i className={`fa-solid ${collapsed ? "fa-bars" : "fa-xmark"}`} />
            </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
            {!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/50">Management</p>}
            <ul className="flex flex-col gap-1">{links.map(link => <li key={link.id}>
                <NavLink to={`/superadmin/${link.id}`} title={collapsed ? link.label : undefined} className={({ isActive }) => `flex w-full items-center rounded-lg text-left text-sm font-medium transition-colors ${collapsed ? "justify-center px-3 py-3" : "gap-3 px-3 py-2.5"} ${isActive ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-emerald-900/60 hover:text-white"}`}>
                    <i className={`fa-solid ${link.icon} w-4 text-center`} />{!collapsed && <span>{link.label}</span>}
                </NavLink>
            </li>)}</ul>
        </nav>
    </aside>;
}
