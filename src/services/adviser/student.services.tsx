import api from "../../config/axios";

export interface Students {
    id: number,
    section: Section,
    student_code: string,
    first_name: string,
    last_name: string,
    middle_name: string,
    gender: string,
    birthdate: string,
    address: string,
    gurdian_name: string,
    gurdian_contact: string,
    created_at?: string,
    status: string
}

export interface Section {
    id: number;
    section_name: string;
    year_level: string;
}

// Matches the display_student() endpoint: each section with up to
// 5 of its students nested in (optionally filtered by search).
export interface SectionWithStudents extends Section {
    students: Students[];
}

export interface createStudentData {

    section_id: number,
    first_name: string,
    last_name: string,
    middle_name: string,
    gender: string,
    birthdate: string,
    gurdian_name: string,
    gurdian_contact: string,
    address: string,
    status: "active" | "inactive",
}

export interface StudentFilters {
    search?: string,
    status?: string,
    performance_level?: "all" | "highly_confident" | "confident" | "developing" | "needs_improvement",
    section_id?: number,
    page?: number,
    per_page?: number,
}

export interface PaginatedStudents {
    data: Students[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface UpdateStudentData {

    section_id?: number,
    first_name?: string,
    last_name?: string,
    middle_name?: string,
    gender?: string,
    birthdate?: string,
    gurdian_name?: string,
    gurdian_contact?: string,
    address?: string,
    status?: "active" | "inactive",
}

export const getAllSections = async () => {
    const response = await api.get<Section[]>("/api/adviser/sections");
    return response.data;
}

// Sections with up to 5 students each, matching SectionController@display_student.
// `search` filters students within each section before the 5-per-section limit is applied.
export const getSectionsWithStudents = async (filters?: { search?: string }) => {
    const response = await api.get<SectionWithStudents[]>("/api/adviser/sections/students", { params: filters });
    return response.data;
}

export const getAllStudents = async (filters?: StudentFilters) => {
    const response = await api.get<PaginatedStudents>("/api/adviser/students", { params: filters });
    return response.data;
}

export const createStudent = async (data: createStudentData) => {
    const response = await api.post<{ message: string; student: Students }>("/api/adviser/students", data);
    return response.data.student;
}

export const updateStudent = async (id: number, data: UpdateStudentData) => {
    const response = await api.put<Students>(`/api/adviser/students/${id}`, data);
    return response.data;
}

export const deleteStudent = async (id: number) => {
    const response = await api.delete(`/api/adviser/students/${id}`);
    return response.data;
}
