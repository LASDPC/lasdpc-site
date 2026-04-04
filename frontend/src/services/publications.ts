import { api } from "@/lib/api";

export interface Publication {
  id: string;
  title: string;
  titlePt: string;
  authors: string;
  venue: string;
  year: number;
  doi: string;
}

export type PublicationInput = Omit<Publication, "id">;

export const publicationsService = {
  list: () => api.get<Publication[]>("/api/v1/publications"),
  get: (id: string) => api.get<Publication>(`/api/v1/publications/${id}`),
  create: (data: PublicationInput) => api.post<Publication>("/api/v1/publications", data),
  update: (id: string, data: PublicationInput) => api.put<Publication>(`/api/v1/publications/${id}`, data),
  remove: (id: string) => api.delete<void>(`/api/v1/publications/${id}`),
};
