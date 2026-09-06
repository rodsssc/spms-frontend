import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/navbar/student/sidebar";
import Header from "../components/navbar/student/header";

export default function StudentLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Area */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>

    </div>
  );
}