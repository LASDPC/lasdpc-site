import { api } from "@/lib/api";

export type UserSuggestion = {
  id: string;
  email?: string | null;
  name?: string | null;
  initials?: string | null;
};

export const usersService = {
  suggest: (query: string, limit = 100) =>
    api.get<UserSuggestion[]>(
      `/api/v1/users/suggest?query=${encodeURIComponent(query)}&limit=${encodeURIComponent(String(limit))}`
    ),
};

