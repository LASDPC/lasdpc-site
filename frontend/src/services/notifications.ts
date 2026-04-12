import { api } from "@/lib/api";

export interface Notification {
  id: string;
  type: "cluster_approved" | "cluster_rejected";
  cluster_name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export const notificationsService = {
  list: () => api.get<Notification[]>("/api/v1/notifications"),
  dismiss: (id: string) => api.delete<void>(`/api/v1/notifications/${id}`),
};
