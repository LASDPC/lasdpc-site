import { api } from "@/lib/api";

export interface CustomFieldDef {
  name: string;
  label: string;
  labelPt: string;
  type: "text" | "number" | "select" | "checkbox" | "date";
  options: string[];
  required: boolean;
}

export interface ClusterRequestInput {
  cluster_id: string;
  start_date: string;
  end_date: string;
  observation?: string;
  custom_field_values?: Record<string, unknown>;
}

export interface ClusterRequestApproveInput {
  access_key?: string;
  access_starts_at?: string;
  access_ends_at?: string;
}

export interface ClusterRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  cluster_id: string;
  cluster_name: string;
  start_date: string;
  end_date: string;
  observation: string;
  custom_field_values: Record<string, unknown>;
  custom_field_defs: CustomFieldDef[];
  status: "pending" | "approved" | "rejected" | "expired" | "revoked";
  created_at: string;
  pre_reservation_expires_at?: string | null;
  resolved_at?: string | null;
  approved_at?: string | null;
  access_key?: string | null;
  access_starts_at?: string | null;
  access_ends_at?: string | null;
  access_revoked_at?: string | null;
}

export interface ClusterUsageEvent {
  id: string;
  cluster_id: string;
  cluster_name: string;
  user_name: string;
  start_date: string;
  end_date: string;
  status: "approved" | "revoked";
  access_starts_at?: string | null;
  access_ends_at?: string | null;
}

export const clusterRequestsService = {
  create: (data: ClusterRequestInput) =>
    api.post<ClusterRequest>("/api/v1/cluster-requests", data),
  list: (status?: ClusterRequest["status"]) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return api.get<ClusterRequest[]>(`/api/v1/cluster-requests${query}`);
  },
  mine: () =>
    api.get<ClusterRequest[]>("/api/v1/cluster-requests/mine"),
  calendar: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const query = params.toString();
    return api.get<ClusterUsageEvent[]>(`/api/v1/cluster-requests/calendar${query ? `?${query}` : ""}`);
  },
  pending: () =>
    api.get<ClusterRequest[]>("/api/v1/cluster-requests/pending"),
  approve: (id: string, data: ClusterRequestApproveInput = {}) =>
    api.put<ClusterRequest>(`/api/v1/cluster-requests/${id}/approve`, data),
  reject: (id: string) =>
    api.put<ClusterRequest>(`/api/v1/cluster-requests/${id}/reject`, {}),
  revoke: (id: string) =>
    api.put<ClusterRequest>(`/api/v1/cluster-requests/${id}/revoke`, {}),
};
