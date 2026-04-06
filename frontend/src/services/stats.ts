import { api } from "@/lib/api";

export interface Stats {
  researchers: number;
  publications: number;
  clusters: number;
}

export const statsService = {
  get: () => api.get<Stats>("/api/v1/stats"),
};
