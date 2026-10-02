import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUser } from "../services/adviser/auth.services";

type AuthenticationStatus = "checking" | "adviser" | "superadmin" | "unauthenticated";

function useAuthentication() {
    const [status, setStatus] = useState<AuthenticationStatus>("checking");

    useEffect(() => {
        let active = true;

        getUser()
            .then((response) => active && setStatus(response.data.role === "superadmin" ? "superadmin" : "adviser"))
            .catch(() => active && setStatus("unauthenticated"));

        return () => {
            active = false;
        };
    }, []);

    return status;
}

export function RequireAuth() {
    const status = useAuthentication();
    const location = useLocation();

    if (status === "checking") return null;
    if (status === "unauthenticated") return <Navigate to="/login" replace state={{ from: location }} />;
    return status === "adviser" ? <Outlet /> : <Navigate to="/superadmin/dashboard" replace />;
}

export function RequireSuperAdmin() {
    const status = useAuthentication();
    if (status === "checking") return null;
    if (status === "unauthenticated") return <Navigate to="/login" replace />;
    return status === "superadmin" ? <Outlet /> : <Navigate to="/adviser/dashboard" replace />;
}

export function RequireGuest() {
    const status = useAuthentication();

    if (status === "checking") return null;

    return status === "superadmin"
        ? <Navigate to="/superadmin/dashboard" replace />
        : status === "adviser" ? <Navigate to="/adviser/dashboard" replace /> : <Outlet />;
}
