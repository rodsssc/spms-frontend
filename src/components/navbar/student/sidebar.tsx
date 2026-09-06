import { NavLink } from "react-router-dom";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
}: SidebarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center rounded-lg text-sm font-medium transition-colors ${
      collapsed
        ? "justify-center px-3 py-3"
        : "gap-3 px-3 py-2.5"
    } ${
      isActive
        ? "bg-emerald-600 text-white"
        : "text-slate-400 hover:bg-emerald-900/60 hover:text-white"
    }`;

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-emerald-900/60 bg-emerald-950 text-slate-200 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div
        className={`flex h-16 items-center border-b border-emerald-900/60 ${
          collapsed
            ? "justify-center px-3"
            : "justify-between px-5"
        }`}
      >
        {/* Brand */}
        <div
          className={`flex min-w-0 items-center overflow-hidden transition-all duration-300 ease-in-out ${
            collapsed
              ? "w-0 -translate-x-3 opacity-0"
              : "w-auto translate-x-0 opacity-100"
          }`}
        >
          <div className="whitespace-nowrap">
            <h1 className="text-sm font-bold tracking-wide text-white">
              SPMS
            </h1>

            <p className="text-[11px] text-emerald-300/60">
              Student Portal
            </p>
          </div>
        </div>

        {/* Burger Button */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white transition-colors hover:bg-emerald-700"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i
            className={`fa-solid ${
              collapsed ? "fa-bars" : "fa-xmark"
            }`}
          />
        </button>
      </div>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">

        {/* Main */}
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/50">
            Main
          </p>
        )}

        <ul className="flex flex-col gap-1">

          {/* Dashboard */}
          <li>
            <NavLink
              to="/student/dashboard"
              title={collapsed ? "Dashboard" : undefined}
              className={linkClass}
            >
              <i className="fa-solid fa-chart-line w-4 text-center" />

              {!collapsed && <span>Dashboard</span>}
            </NavLink>
          </li>

          {/* My Modules */}
          <li>
            <NavLink
              to="/student/module"
              title={collapsed ? "My Modules" : undefined}
              className={linkClass}
            >
              <i className="fa-solid fa-book-open w-4 text-center" />

              {!collapsed && <span>My Modules</span>}
            </NavLink>
          </li>

        </ul>

        {/* =====================================================
            LEARNING
        ====================================================== */}
        {!collapsed && (
          <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/50">
            Learning
          </p>
        )}

        <ul className="flex flex-col gap-1">

          {/* Progress */}
          <li>
            <NavLink
              to="/student/progress"
              title={collapsed ? "My Progress" : undefined}
              className={linkClass}
            >
              <i className="fa-solid fa-chart-pie w-4 text-center" />

              {!collapsed && <span>My Progress</span>}
            </NavLink>
          </li>

        </ul>

      </nav>
    </aside>
  );
}