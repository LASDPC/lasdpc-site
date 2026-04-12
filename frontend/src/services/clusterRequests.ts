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
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export const clusterRequestsService = {
  create: (data: ClusterRequestInput) =>
    api.post<ClusterRequest>("/api/v1/cluster-requests", data),
  mine: () =>
    api.get<ClusterRequest[]>("/api/v1/cluster-requests/mine"),
  pending: () =>
    api.get<ClusterRequest[]>("/api/v1/cluster-requests/pending"),
  approve: (id: string) =>
    api.put<ClusterRequest>(`/api/v1/cluster-requests/${id}/approve`, {}),
  reject: (id: string) =>
    api.put<ClusterRequest>(`/api/v1/cluster-requests/${id}/reject`, {}),
};
