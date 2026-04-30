import { api } from "@/lib/api";

export interface RoomEvent {
  id: string;
  room: string;
  title: string;
  start_time: string;
  end_time: string;
  user_id: string;
  user_name: string;
  created_at: string;
  participants?: Array<{
    user_id?: string | null;
    name?: string | null;
    email?: string | null;
  }>;
}

export interface RoomEventCreate {
  room: string;
  title: string;
  start_time: string;
  end_time: string;
  participants?: string[];
}

export const roomEventsService = {
  list: (room: string, start: string, end: string) =>
    api.get<RoomEvent[]>(`/api/v1/room-events?room=${encodeURIComponent(room)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
  create: (data: RoomEventCreate) =>
    api.post<RoomEvent>("/api/v1/room-events", data),
  delete: (id: string) =>
    api.delete<void>(`/api/v1/room-events/${id}`),
  updateParticipants: (id: string, participants: string[]) =>
    api.patch<RoomEvent>(`/api/v1/room-events/${id}/participants`, { participants }),
};
