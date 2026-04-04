import { api } from "@/lib/api";

export interface Doc {
  id: string;
  category: string;
  title: string;
  titlePt: string;
  content: string;
  contentPt: string;
  updatedAt: string;
}

export type DocInput = Omit<Doc, "id">;

export const docsService = {
  list: () => api.get<Doc[]>("/api/v1/docs"),
  get: (id: string) => api.get<Doc>(`/api/v1/docs/${id}`),
  create: (data: DocInput) => api.post<Doc>("/api/v1/docs", data),
  update: (id: string, data: DocInput) => api.put<Doc>(`/api/v1/docs/${id}`, data),
  remove: (id: string) => api.delete<void>(`/api/v1/docs/${id}`),
};
