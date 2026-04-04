import { api } from "@/lib/api";

export interface Cluster {
  id: string;
  name: string;
  description: string;
  descriptionPt: string;
  cpuUsage: number;
  gpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  status: "online" | "maintenance";
}

export type ClusterInput = Omit<Cluster, "id">;

export interface InfrastructureData {
  clusters: Cluster[];
  resources: string[];
}

export const infrastructureService = {
  get: () => api.get<InfrastructureData>("/api/v1/infrastructure"),
  getCluster: (id: string) => api.get<Cluster>(`/api/v1/infrastructure/${id}`),
  createCluster: (data: ClusterInput) => api.post<Cluster>("/api/v1/infrastructure", data),
  updateCluster: (id: string, data: ClusterInput) => api.put<Cluster>(`/api/v1/infrastructure/${id}`, data),
  removeCluster: (id: string) => api.delete<void>(`/api/v1/infrastructure/${id}`),
};
