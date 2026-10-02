import api from "../../config/axios";
import Swal from "sweetalert2";

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface Adviser {
    id: number;
    name: string;
    email: string;
}

export interface Section {
    id: number;
    section_name: string;
    year_level: string;
    school_year: string;
    status: "active" | "inactive";
    adviser_id: number | null;
    adviser?: Adviser | null;
    students_count: number;
}

export interface Student {
    id: number;
    student_code: string;
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    section_id: number;
    section?: Section;
    gender: string;
    birthdate: string;
    gurdian_name: string;
    gurdian_contact: string;
    address: string;
    status: "active" | "inactive";
}

export const getSectionsForForms = async () => {
    const response = await api.get<Paginated<Section>>("/api/superadmin/sections", { params: { per_page: 100 } });
    return response.data.data;
};

export const showToast = (icon: "success" | "error", title: string, text?: string) =>
    Swal.fire({
        toast: true, icon, title, text, position: "top-end", showConfirmButton: false,
        timer: 2500, timerProgressBar: true, width: "320px",
    });

export const errorMessage = (error: any) => {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined;
    return errors ? Object.values(errors).flat()[0] : error.response?.data?.message || "Please check the information and try again.";
};
