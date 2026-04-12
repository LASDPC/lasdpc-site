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
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string;
  observation?: string;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/api/v1/auth/login", { email, password }),
  register: (data: RegisterData) =>
    api.post<User>("/api/v1/auth/register", data),
  me: () => api.get<User>("/api/v1/users/me"),
  createUser: (data: UserCreateData) => api.post<User>("/api/v1/users", data),
  listPending: () => api.get<User[]>("/api/v1/users/pending"),
  approveUser: (id: string) => api.put<User>(`/api/v1/users/${id}/approve`, {}),
  rejectUser: (id: string) => api.put<User>(`/api/v1/users/${id}/reject`, {}),
};
