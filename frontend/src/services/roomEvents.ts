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
    initials?: string | null;
    photo?: string | null;
    avatar?: string | null;
    usp_number?: string | null;
  }>;
}

export interface RoomEventCreate {
  room: string;
  title: string;
  start_time: string;
  end_time: string;
  participants?: string[];
}

export interface RoomEventUpdate {
  title?: string;
  participants?: string[];
  start_time?: string;
  end_time?: string;
}

export const roomEventsService = {
  list: (room: string, start: string, end: string) =>
    api.get<RoomEvent[]>(`/api/v1/room-events?room=${encodeURIComponent(room)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
  adminList: (start: string, end: string, room?: string) => {
    const params = new URLSearchParams({ start, end });
    if (room) params.set("room", room);
    return api.get<RoomEvent[]>(`/api/v1/room-events/admin?${params.toString()}`);
  },
  create: (data: RoomEventCreate) =>
    api.post<RoomEvent>("/api/v1/room-events", data),
  delete: (id: string) =>
    api.delete<void>(`/api/v1/room-events/${id}`),
  updateParticipants: (id: string, participants: string[]) =>
    api.patch<RoomEvent>(`/api/v1/room-events/${id}/participants`, { participants }),
  update: (id: string, data: RoomEventUpdate) =>
    api.patch<RoomEvent>(`/api/v1/room-events/${id}`, data),
};
