import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { peopleService } from "@/services/people";
import { authService, type UserCreateData, type User } from "@/services/auth";
import { api } from "@/lib/api";

export function useDocentes() {
  return useQuery({ queryKey: ["docentes"], queryFn: peopleService.listDocentes });
}

export function useDocente(id: string) {
  return useQuery({ queryKey: ["docentes", id], queryFn: () => peopleService.getDocente(id), enabled: !!id });
}

export function useCreateDocente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreateData) => authService.createUser(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["docentes"] }),
  });
}

export function useUpdateDocente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => peopleService.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["docentes"] }),
  });
}

export function useDeleteDocente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/v1/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["docentes"] }),
  });
}

export function useStudents() {
  return useQuery({ queryKey: ["students"], queryFn: peopleService.listStudents });
}

export function useStudent(id: string) {
  return useQuery({ queryKey: ["students", id], queryFn: () => peopleService.getStudent(id), enabled: !!id });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreateData) => authService.createUser(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => peopleService.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/v1/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useUser(id: string) {
  return useQuery({ queryKey: ["user", id], queryFn: () => peopleService.getUser(id), enabled: !!id });
}
