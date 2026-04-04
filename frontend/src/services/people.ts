import { api } from "@/lib/api";

export interface Docente {
  id: string;
  name: string;
  role: string;
  rolePt: string;
  area: string;
  areaPt: string;
  email: string;
  lattes?: string | null;
  orcid?: string | null;
  scholar?: string | null;
  page?: string | null;
  photo?: string | null;
}

export type DocenteInput = Omit<Docente, "id">;

export interface Student {
  id: string;
  name: string;
  level: string;
  levelPt: string;
  area: string;
  areaPt: string;
}

export type StudentInput = Omit<Student, "id">;

export const peopleService = {
  listDocentes: () => api.get<Docente[]>("/api/v1/people/docentes"),
  getDocente: (id: string) => api.get<Docente>(`/api/v1/people/docentes/${id}`),
  createDocente: (data: DocenteInput) => api.post<Docente>("/api/v1/people/docentes", data),
  updateDocente: (id: string, data: DocenteInput) => api.put<Docente>(`/api/v1/people/docentes/${id}`, data),
  removeDocente: (id: string) => api.delete<void>(`/api/v1/people/docentes/${id}`),

  listStudents: () => api.get<Student[]>("/api/v1/people/students"),
  getStudent: (id: string) => api.get<Student>(`/api/v1/people/students/${id}`),
  createStudent: (data: StudentInput) => api.post<Student>("/api/v1/people/students", data),
  updateStudent: (id: string, data: StudentInput) => api.put<Student>(`/api/v1/people/students/${id}`, data),
  removeStudent: (id: string) => api.delete<void>(`/api/v1/people/students/${id}`),
};
