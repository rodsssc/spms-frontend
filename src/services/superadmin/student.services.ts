import api from "../../config/axios";
import type { Paginated, Student } from "./common.services";

export interface StudentFilters {
    search?: string;
    status?: string;
    section_id?: string;
    page?: number;
    per_page?: number;
}

export const getStudents = async (params: StudentFilters) => {
    const response = await api.get<Paginated<Student>>("/api/superadmin/students", { params });
    return response.data;
};

export const saveStudent = async (data: Record<string, string | number>, id?: number) =>
    api.request({ method: id ? "put" : "post", url: `/api/superadmin/students${id ? `/${id}` : ""}`, data });
