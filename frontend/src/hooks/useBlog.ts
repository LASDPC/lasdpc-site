import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogService, type BlogPostInput } from "@/services/blog";

export function useBlog() {
  return useQuery({ queryKey: ["blog"], queryFn: blogService.list });
}

export function useBlogPost(id: string) {
  return useQuery({ queryKey: ["blog", id], queryFn: () => blogService.get(id), enabled: !!id });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: BlogPostInput) => blogService.create(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["blog"] }) });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: BlogPostInput }) => blogService.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["blog"] }) });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => blogService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["blog"] }) });
}
