import api from "../../config/axios";

export interface Sections{
    id: number,
    adviser_name: string,
    year_level: string,
    section_name: string,
    school_year: string,
    created_at?: string,
    status: string
}

export interface CreateSectionData {
    section_name: string,
    adviser_name: string,
    year_level: string,
    school_year: string,
    status: "active" | "inactive",
}

export interface UpdateSectionData {
    section_name: string
}

export interface SectionFilters {
    search?: string,
    year_level?: string,
}

export const getAllSections = async (filters?: SectionFilters) => {
    const response = await api.get<Sections[]>("/api/adviser/sections", {
        params: filters,
    });

    return response.data;
}

export const getSectionById = async (id: number) => {
    const response = await api.get<Sections>(
        `/api/adviser/section/${id}`
    );

    return response.data;
}

export const createSection = async (data:CreateSectionData) => {
    const response = await api.post<Sections>("/api/adviser/sections", data);
    return response.data;
};

export const updateSection = async (id: number, data: UpdateSectionData) => {
    const response = await api.put<Sections>(`/api/adviser/section/${id}`, data);
    return response.data;
};


export const deleteSection = async (id: number) => {
    const response = await api.delete(`/api/adviser/section/${id}`);

    return response.data;
}