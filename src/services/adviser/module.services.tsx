import api from "../../config/axios";
import type { Sections } from "./section.services";
import type { Students } from "./student.services";

export interface Module {
    id: number;
    adviser_id: number;
    title: string;
    year_level: string;
    description: string | null;
    reading_scripts_count?: number;
    sections?: Sections[];
}

export interface ReadingScript {
    id: number;
    module_id: number;
    title: string;
    content: string | null;
    word_count: number;
    due_date: string | null;
    created_at?: string;
}

export interface CreateModuleData {
    title: string;
    year_level: string;
    description?: string;
}

export interface CreateReadingScriptData {
    module_id: number;
    title: string;
    content: string;
    due_date?: string;
}

export const getAllModules = async () => {
    const response = await api.get<Module[]>("/api/adviser/module");
    return response.data;
};

export const createModule = async (data: CreateModuleData) => {
    const response = await api.post<{ data: Module }>("/api/adviser/module", data);
    return response.data.data;
};

export const assignModuleSections = async (moduleId: number, section_ids: number[]) => {
    const response = await api.post<{ module: Module }>(
        `/api/adviser/module/${moduleId}/sections`,
        { section_ids }
    );
    return response.data.module;
};

export const getAllReadingScripts = async (module_id?: number) => {
    const response = await api.get<ReadingScript[]>("/api/adviser/scripts", {
        params: module_id ? { module_id } : undefined,
    });
    return response.data;
};

export const createReadingScript = async (data: CreateReadingScriptData) => {
    const response = await api.post<{ script: ReadingScript }>("/api/adviser/scripts", data);
    return response.data.script;
};

export const updateReadingScript = async (id: number, data: Partial<CreateReadingScriptData>) => {
    const response = await api.put<{ script: ReadingScript }>(`/api/adviser/scripts/${id}`, data);
    return response.data.script;
};

export const deleteReadingScript = async (id: number) => {
    await api.delete(`/api/adviser/scripts/${id}`);
};

export interface ModuleStudent extends Students {
    reading_scripts: Array<ReadingScript & { pivot: { status: "pending" | "completed" | "non-compliant" } }>;
}

export const getModuleStudents = async (moduleId: number, section_id?: number) => {
    const response = await api.get<ModuleStudent[]>(`/api/adviser/module/${moduleId}/students`, {
        params: section_id ? { section_id } : undefined,
    });
    return response.data;
};

export const updateStudentScriptStatus = async (scriptId: number, studentId: number, status: "pending" | "completed" | "non-compliant") => {
    await api.put(`/api/adviser/scripts/${scriptId}/students/${studentId}`, { status });
};
