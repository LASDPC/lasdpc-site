import { api } from "@/lib/api";

export interface Room {
  id: string;
  name: string;
  created_at: string;
}

export const roomsService = {
  list: () => api.get<Room[]>("/api/v1/rooms"),
  create: (name: string) => api.post<Room>("/api/v1/rooms", { name }),
  delete: (id: string) => api.delete<void>(`/api/v1/rooms/${id}`),
};
