import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomEventsService, type RoomEventCreate } from "@/services/roomEvents";

export function useRoomEvents(room: string, start: string, end: string) {
  return useQuery({
    queryKey: ["room-events", room, start, end],
    queryFn: () => roomEventsService.list(room, start, end),
    // Avoid UI flicker during week navigation by keeping previous results while fetching new ones.
    placeholderData: (prev) => prev,
    enabled: !!room && !!start && !!end,
  });
}

export function useCreateRoomEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RoomEventCreate) => roomEventsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["room-events"] }),
  });
}

export function useDeleteRoomEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomEventsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["room-events"] }),
  });
}
