import { api } from "@/lib/api";

export interface Notification {
  id: string;
  type: "cluster_approved" | "cluster_rejected" | "room_event_invite";
  cluster_name?: string;
  start_date?: string;
  end_date?: string;
  event_id?: string;
  room?: string;
  event_title?: string;
  start_time?: string;
  end_time?: string;
  actor_name?: string;
  created_at: string;
}

export const notificationsService = {
  list: () => api.get<Notification[]>("/api/v1/notifications"),
  dismiss: (id: string) => api.delete<void>(`/api/v1/notifications/${id}`),
};
