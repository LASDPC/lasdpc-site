import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { infrastructureService, type ClusterInput } from "@/services/infrastructure";

export function useInfrastructure() {
  return useQuery({ queryKey: ["infrastructure"], queryFn: infrastructureService.get });
}

export function useCluster(id: string) {
  return useQuery({ queryKey: ["clusters", id], queryFn: () => infrastructureService.getCluster(id), enabled: !!id });
}

export function useCreateCluster() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: ClusterInput) => infrastructureService.createCluster(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["infrastructure"] }) });
}

export function useUpdateCluster() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: ClusterInput }) => infrastructureService.updateCluster(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["infrastructure"] }) });
}

export function useDeleteCluster() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => infrastructureService.removeCluster(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["infrastructure"] }) });
}
