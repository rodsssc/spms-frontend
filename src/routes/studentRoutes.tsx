import { Route } from "react-router-dom";

import { RequireStudentAuth, RequireStudentGuest } from "./studentAuthGuards"; // adjust path

import StudentLayout from "../layout/studentLayout";

import Login from "../pages/student/login";
import Dashboard from "../pages/student/dashboard";
import Module from "../pages/student/module";
import Assessment from "../pages/student/assessment";

export default function StudentRoutes() {
  return (
    <>
      {/* Student Login */}
      <Route element={<RequireStudentGuest />}>
        <Route path="/student/login" element={<Login />} />
      </Route>

      {/* Student Portal */}
      <Route element={<RequireStudentAuth />}>
        <Route element={<StudentLayout />}>

          {/* Dashboard */}
          <Route path="/student/dashboard" element={<Dashboard />} />

          {/* Modules */}
          <Route path="/student/module" element={<Module />} />

          <Route path="/student/assessment/:moduleId/:scriptId" element={<Assessment />} />

        </Route>
      </Route>
    </>
  );
}