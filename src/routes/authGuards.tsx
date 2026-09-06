import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUser } from "../services/adviser/auth.services";

type AuthenticationStatus = "checking" | "authenticated" | "unauthenticated";

function useAuthentication() {
    const [status, setStatus] = useState<AuthenticationStatus>("checking");

    useEffect(() => {
        let active = true;

        getUser()
            .then(() => active && setStatus("authenticated"))
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

    return status === "authenticated"
        ? <Outlet />
        : <Navigate to="/login" replace state={{ from: location }} />;
}

export function RequireGuest() {
    const status = useAuthentication();

    if (status === "checking") return null;

    return status === "authenticated"
        ? <Navigate to="/adviser/dashboard" replace />
        : <Outlet />;
}
