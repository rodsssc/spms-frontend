// services/adviser/auth.services.tsx

import api from "../../config/axios"

export const login = async (email: string, password: string) => {
    await api.get("/sanctum/csrf-cookie");

    return api.post("/api/login", { email, password });
};

export const register = async (
    name: string,
    email: string,
    password: string,
    confirm_password: string
) => {
    await api.get("/sanctum/csrf-cookie");

    return api.post("/register", {
        name,
        email,
        password,
        password_confirmation: confirm_password,
    });
};

export const logout = async () => {
    await api.get("/sanctum/csrf-cookie");

    return api.post("/api/logout");
};

export const getUser = async () => {
    return api.get("/api/user");
};
