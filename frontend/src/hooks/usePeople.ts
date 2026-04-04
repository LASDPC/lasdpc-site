import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { peopleService, type DocenteInput, type StudentInput } from "@/services/people";

export function useDocentes() {
  return useQuery({ queryKey: ["docentes"], queryFn: peopleService.listDocentes });
}

export function useCreateDocente() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: DocenteInput) => peopleService.createDocente(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["docentes"] }) });
}

export function useUpdateDocente() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: DocenteInput }) => peopleService.updateDocente(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["docentes"] }) });
}

export function useDeleteDocente() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => peopleService.removeDocente(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["docentes"] }) });
}

export function useStudents() {
  return useQuery({ queryKey: ["students"], queryFn: peopleService.listStudents });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: StudentInput) => peopleService.createStudent(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }) });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: StudentInput }) => peopleService.updateStudent(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }) });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => peopleService.removeStudent(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }) });
}
