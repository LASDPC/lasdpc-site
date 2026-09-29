import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { docsService, docFoldersService, type DocInput } from "@/services/docs";

export function useDocs() {
  return useQuery({ queryKey: ["docs"], queryFn: docsService.list });
}

export function useDoc(id: string) {
  return useQuery({ queryKey: ["docs", id], queryFn: () => docsService.get(id), enabled: !!id });
}

export function useCreateDoc() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: DocInput) => docsService.create(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["docs"] }) });
}

export function useUpdateDoc() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: DocInput }) => docsService.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["docs"] }) });
}

export function useDeleteDoc() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => docsService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["docs"] }) });
}

export function useDocFolders() {
  return useQuery({ queryKey: ["doc-folders"], queryFn: docFoldersService.list });
}

export function useCreateDocFolder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: docFoldersService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-folders"] }) });
}

export function useDeleteDocFolder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: docFoldersService.remove, onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-folders"] }) });
}
