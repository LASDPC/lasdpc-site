import { api } from "@/lib/api";

export interface Project {
  id: string;
  title: string;
  titlePt: string;
  description: string;
  descriptionPt: string;
  content: string;
  contentPt: string;
  status: "active" | "completed";
  tags: string[];
  publications: number;
  impact: "High" | "Medium";
}

export type ProjectInput = Omit<Project, "id">;

export const projectsService = {
  list: () => api.get<Project[]>("/api/v1/projects"),
  get: (id: string) => api.get<Project>(`/api/v1/projects/${id}`),
  create: (data: ProjectInput) => api.post<Project>("/api/v1/projects", data),
  update: (id: string, data: ProjectInput) => api.put<Project>(`/api/v1/projects/${id}`, data),
  remove: (id: string) => api.delete<void>(`/api/v1/projects/${id}`),
};
