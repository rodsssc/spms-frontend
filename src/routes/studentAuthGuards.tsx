// StudentAuthGuards.tsx
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getStudent } from "../services/student/auth.services";

type AuthenticationStatus = "checking" | "authenticated" | "unauthenticated";

function useStudentAuthentication() {
    const [status, setStatus] = useState<AuthenticationStatus>("checking");

    useEffect(() => {
        let active = true;

        getStudent()
            .then(() => active && setStatus("authenticated"))
            .catch(() => active && setStatus("unauthenticated"));

        return () => {
            active = false;
        };
    }, []);

    return status;
}

export function RequireStudentAuth() {
    const status = useStudentAuthentication();
    const location = useLocation();

    if (status === "checking") return null;

    return status === "authenticated"
        ? <Outlet />
        : <Navigate to="/student/login" replace state={{ from: location }} />;
}

export function RequireStudentGuest() {
    const status = useStudentAuthentication();

    if (status === "checking") return null;

    return status === "authenticated"
        ? <Navigate to="/student/dashboard" replace />
        : <Outlet />;
}