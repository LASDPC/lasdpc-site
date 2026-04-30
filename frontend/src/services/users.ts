import { api } from "@/lib/api";
import type { User } from "@/services/auth";

export type UserSuggestion = {
  id: string;
  email?: string | null;
  name?: string | null;
  initials?: string | null;
  photo?: string | null;
  avatar?: string | null;
  usp_number?: string | null;
  role?: string | null;
};

export const usersService = {
  list: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return api.get<User[]>(`/api/v1/users${query}`);
  },
  suggest: (query: string, limit = 100) =>
    api.get<UserSuggestion[]>(
      `/api/v1/users/suggest?query=${encodeURIComponent(query)}&limit=${encodeURIComponent(String(limit))}`
    ),
};
