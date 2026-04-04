import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "normal";
  avatar?: string | null;
  initials: string;
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
  initials: string;
  avatar?: string;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/api/v1/auth/login", { email, password }),
  me: () => api.get<User>("/api/v1/users/me"),
  createUser: (data: UserCreateData) => api.post<User>("/api/v1/users", data),
};
