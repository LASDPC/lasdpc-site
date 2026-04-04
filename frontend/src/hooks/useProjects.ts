import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsService, type ProjectInput } from "@/services/projects";

export function useProjects() {
  return useQuery({ queryKey: ["projects"], queryFn: projectsService.list });
}

export function useProject(id: string) {
  return useQuery({ queryKey: ["projects", id], queryFn: () => projectsService.get(id), enabled: !!id });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: ProjectInput) => projectsService.create(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }) });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: ProjectInput }) => projectsService.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }) });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => projectsService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }) });
}
