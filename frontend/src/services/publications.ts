import { api } from "@/lib/api";

export type PublicationType =
  | "article"
  | "conference"
  | "journal"
  | "book"
  | "chapter"
  | "thesis"
  | "preprint"
  | "other";

export type PublicationStatus = "published" | "preprint" | "under-review" | "in-press";

export type PublicationImpact = "High" | "Medium" | "Low";

export interface Publication {
  id: string;
  title: string;
  titlePt: string;
  authors: string;
  venue: string;
  year: number;
  doi: string;
  /** Filterable metadata - mirrors the Project shape so the research page can
   *  offer a shared, faceted search across projects and publications. */
  tags: string[];
  type: PublicationType;
  status: PublicationStatus;
  impact: PublicationImpact;
  area?: string | null;
  areaPt?: string | null;
}

export type PublicationInput = Omit<Publication, "id">;

export const publicationsService = {
  list: () => api.get<Publication[]>("/api/v1/publications"),
  get: (id: string) => api.get<Publication>(`/api/v1/publications/${id}`),
  create: (data: PublicationInput) => api.post<Publication>("/api/v1/publications", data),
  update: (id: string, data: PublicationInput) => api.put<Publication>(`/api/v1/publications/${id}`, data),
  remove: (id: string) => api.delete<void>(`/api/v1/publications/${id}`),
};
