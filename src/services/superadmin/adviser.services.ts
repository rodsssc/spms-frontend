import api from "../../config/axios";
import type { Adviser, Paginated } from "./common.services";

export const getAdvisers = async (params: { search?: string; page?: number; per_page?: number }) => {
    const response = await api.get<Paginated<Adviser>>("/api/superadmin/advisers", { params });
    return response.data;
};

export const saveAdviser = async (data: Record<string, string>, id?: number) =>
    api.request({ method: id ? "put" : "post", url: `/api/superadmin/advisers${id ? `/${id}` : ""}`, data });
