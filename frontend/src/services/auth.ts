import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_admin: boolean;
  status?: string;
  avatar?: string | null;
  initials: string;
  title?: string | null;
  titlePt?: string | null;
  area?: string | null;
  areaPt?: string | null;
  lattes?: string | null;
  orcid?: string | null;
  scholar?: string | null;
  page?: string | null;
  photo?: string | null;
  level?: string | null;
  levelPt?: string | null;
  // Enriched profile
  research_areas?: string[] | null;
  year_joined?: number | null;
  bio?: string | null;
  bioPt?: string | null;
  skills?: string[] | null;
  graduation_year?: number | null;
  // Social links
  linkedin?: string | null;
  github?: string | null;
  twitter?: string | null;
  researchgate?: string | null;
  // USP
  usp_number?: string | null;
  // LGPD
  lgpd_consent?: boolean | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserCreateData {
  email: string;
  password: string;
  name: string;
  role: string;
  is_admin?: boolean;
  initials: string;
  avatar?: string;
  title?: string;
  titlePt?: string;
  area?: string;
  areaPt?: string;
  lattes?: string;
  orcid?: string;
  scholar?: string;
  page?: string;
  photo?: string;
  level?: string;
  levelPt?: string;
  research_areas?: string[];
  year_joined?: number;
  bio?: string;
  bioPt?: string;
  skills?: string[];
  graduation_year?: number;
  linkedin?: string;
  github?: string;
  twitter?: string;
  researchgate?: string;
  usp_number?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string;
  observation?: string;
  usp_number?: string;
  lgpd_consent: boolean;
}

export const authService = {
  login: (identifier: string, password: string) =>
    api.post<LoginResponse>("/api/v1/auth/login", { identifier, password }),
  register: (data: RegisterData) =>
    api.post<User>("/api/v1/auth/register", data),
  me: () => api.get<User>("/api/v1/users/me"),
  createUser: (data: UserCreateData) => api.post<User>("/api/v1/users", data),
  listPending: () => api.get<User[]>("/api/v1/users/pending"),
  approveUser: (id: string) => api.put<User>(`/api/v1/users/${id}/approve`, {}),
  rejectUser: (id: string) => api.put<User>(`/api/v1/users/${id}/reject`, {}),
  // LGPD
  requestLgpdExport: () => api.post("/api/v1/users/me/lgpd/export", {}),
  requestLgpdDeletion: (reason?: string) => api.post("/api/v1/users/me/lgpd/deletion", { reason }),
  listLgpdRequests: () => api.get("/api/v1/users/lgpd-requests"),
  completeLgpdRequest: (id: string) => api.put(`/api/v1/users/lgpd-requests/${id}/complete`, {}),
  rejectLgpdRequest: (id: string) => api.put(`/api/v1/users/lgpd-requests/${id}/reject`, {}),
};
