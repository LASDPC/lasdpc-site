import { api } from "@/lib/api";
import type { User } from "@/services/auth";

export type { User as Docente, User as Student } from "@/services/auth";

export type DocenteInput = Omit<User, "id">;
export type StudentInput = Omit<User, "id">;

export const peopleService = {
  listDocentes: () => api.get<User[]>("/api/v1/people/docentes"),
  getDocente: (id: string) => api.get<User>(`/api/v1/people/docentes/${id}`),

  listStudents: () => api.get<User[]>("/api/v1/people/students"),
  getStudent: (id: string) => api.get<User>(`/api/v1/people/students/${id}`),

  getUser: (id: string) => api.get<User>(`/api/v1/users/${id}`),
  updateUser: (id: string, data: Partial<User>) => api.put<User>(`/api/v1/users/${id}`, data),
};
