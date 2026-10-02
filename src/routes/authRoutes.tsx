import { Route, Navigate } from "react-router-dom";
import AuthLayout from "../layout/authLayout";
import Login from "../pages/auth/login";
import { RequireGuest } from "./authGuards"



export default function AuthRoutes() {
  return (
    <>
      <Route element={<RequireGuest />}>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
        </Route>
      </Route>

      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </>
  );
}
