import { api } from "@/lib/api";

export interface BlogPost {
  id: string;
  title: string;
  titlePt: string;
  excerpt: string;
  excerptPt: string;
  content: string;
  contentPt: string;
  date: string;
  tag: string;
  author: string;
  coverImage?: string;
}

export type BlogPostInput = Omit<BlogPost, "id">;

export const blogService = {
  list: () => api.get<BlogPost[]>("/api/v1/blog"),
  get: (id: string) => api.get<BlogPost>(`/api/v1/blog/${id}`),
  create: (data: BlogPostInput) => api.post<BlogPost>("/api/v1/blog", data),
  update: (id: string, data: BlogPostInput) => api.put<BlogPost>(`/api/v1/blog/${id}`, data),
  remove: (id: string) => api.delete<void>(`/api/v1/blog/${id}`),
};
