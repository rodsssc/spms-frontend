import api from "../../config/axios";
import type { Paginated, Section } from "./common.services";

export interface SectionFilters {
    search?: string;
    year_level?: string;
    status?: string;
    page?: number;
    per_page?: number;
}

export const getSections = async (params: SectionFilters) => {
    const response = await api.get<Paginated<Section>>("/api/superadmin/sections", { params });
    return response.data;
};

export const saveSection = async (data: Record<string, string | number | null>, id?: number) =>
    api.request({ method: id ? "put" : "post", url: `/api/superadmin/sections${id ? `/${id}` : ""}`, data });

export const assignAdviser = async (sectionId: number, adviserId: string) =>
    api.put(`/api/superadmin/sections/${sectionId}/adviser`, { adviser_id: adviserId || null });
