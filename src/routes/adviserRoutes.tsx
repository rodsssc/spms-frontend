// AdviserRoutes.tsx
import { Route } from "react-router-dom";
import { RequireAuth } from "./authGuards" // adjust path
import AdviserLayout from "../layout/adviserLayout";
import Dashboard from "../pages/adviser/dashboard";
import Student from "../pages/adviser/student";
import Section from "../pages/adviser/section";
import Module from "../pages/adviser/module";
import ModuleDetail from "../pages/adviser/module_details";
import Monitoring from "../pages/adviser/monitoring";
import Assessment from "../pages/adviser/assesment";
import AssessmentResult from "../pages/adviser/assessment_result";
import ViewStudent from "../pages/adviser/view_student";

export default function AdviserRoutes() {
    return (
        <Route element={<RequireAuth />}>
            <Route element={<AdviserLayout />}>
                <Route path="/adviser/dashboard" element={<Dashboard />} />
                <Route path="/adviser/student" element={<Student />} />
                <Route path="/adviser/view-student" element={<ViewStudent />} />
                <Route path="/adviser/section" element={<Section />} />
                <Route path="/adviser/module" element={<Module />} />
                <Route path="/adviser/module/:moduleId" element={<ModuleDetail />} />
                <Route path="/adviser/monitoring" element={<Monitoring />} />
                <Route path="/adviser/assessment" element={<Assessment />} />
                <Route path="/adviser/assessment-result/:assesmentId" element={<AssessmentResult />} />
            </Route>
        </Route>
    );
}