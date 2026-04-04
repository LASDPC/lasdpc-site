import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { publicationsService, type PublicationInput } from "@/services/publications";

export function usePublications() {
  return useQuery({ queryKey: ["publications"], queryFn: publicationsService.list });
}

export function usePublication(id: string) {
  return useQuery({ queryKey: ["publications", id], queryFn: () => publicationsService.get(id), enabled: !!id });
}

export function useCreatePublication() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: PublicationInput) => publicationsService.create(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["publications"] }) });
}

export function useUpdatePublication() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: PublicationInput }) => publicationsService.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["publications"] }) });
}

export function useDeletePublication() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => publicationsService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["publications"] }) });
}
