import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roomsService } from "@/services/rooms";

export function useRooms() {
  return useQuery({ queryKey: ["rooms"], queryFn: roomsService.list });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => roomsService.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
}
