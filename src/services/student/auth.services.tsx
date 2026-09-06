// services/student/auth.services.tsx

import api from "../../config/axios";

export const login = async (student_code: string) => {
    await api.get("/sanctum/csrf-cookie");

    return api.post("/api/student/login", {
        student_code,
    });
};

export const logout = async () => {
    await api.get("/sanctum/csrf-cookie");

    return api.post("/api/student/logout");
};

export const getStudent = async () => {
    return api.get("/api/student/user");
};