import { useQuery } from "@tanstack/react-query";
import { statsService } from "@/services/stats";

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: statsService.get, staleTime: 60_000 });
}
