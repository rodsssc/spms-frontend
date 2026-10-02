import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdviserRoutes from "./adviserRoutes";
import AuthRoutes from "./authRoutes";
import StudentRoutes from "./studentRoutes";
import { RequireSuperAdmin } from "./authGuards";
import SuperAdminLayout from "../layout/superadminLayout";
import SuperAdminDashboard from "../pages/superadmin/dashboard";
import SuperAdminAdvisers from "../pages/superadmin/advisers";
import SuperAdminStudents from "../pages/superadmin/students";
import SuperAdminSections from "../pages/superadmin/sections";

export default function AppRoutes(){
    return(
        <BrowserRouter>
            <Routes>
                {AdviserRoutes()},
                {AuthRoutes()},
                {StudentRoutes()}
                <Route element={<RequireSuperAdmin />}>
                    <Route path="/superadmin" element={<SuperAdminLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<SuperAdminDashboard />} />
                        <Route path="advisers" element={<SuperAdminAdvisers />} />
                        <Route path="students" element={<SuperAdminStudents />} />
                        <Route path="sections" element={<SuperAdminSections />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
