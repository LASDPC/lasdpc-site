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
  category?: string;
}

export type BlogPostInput = Omit<BlogPost, "id">;

export interface BlogListFilters {
  q?: string;
  tag?: string;
  year?: string;
  author?: string;
  category?: string;
}

const blogListUrl = (filters: BlogListFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    const clean = value?.trim();
    if (clean) params.set(key, clean);
  });
  const query = params.toString();
  return query ? `/api/v1/blog?${query}` : "/api/v1/blog";
};

export const blogService = {
  list: (filters?: BlogListFilters) => api.get<BlogPost[]>(blogListUrl(filters)),
  get: (id: string) => api.get<BlogPost>(`/api/v1/blog/${id}`),
  create: (data: BlogPostInput) => api.post<BlogPost>("/api/v1/blog", data),
  update: (id: string, data: BlogPostInput) => api.put<BlogPost>(`/api/v1/blog/${id}`, data),
  remove: (id: string) => api.delete<void>(`/api/v1/blog/${id}`),
};
