import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomEventsService, type RoomEvent, type RoomEventCreate } from "@/services/roomEvents";

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
    onSuccess: (created) => {
      // Optimistically merge into any cached week ranges that contain this event,
      // so the user sees it immediately (no "shows only after reload" glitch).
      const createdStart = new Date(created.start_time);
      const createdEnd = new Date(created.end_time);

      const entries = qc.getQueriesData<RoomEvent[]>({ queryKey: ["room-events"] });
      for (const [key, old] of entries) {
        if (!Array.isArray(key) || key.length < 4) continue;
        const keyRoom = String(key[1] ?? "");
        const keyStart = new Date(String(key[2] ?? ""));
        const keyEnd = new Date(String(key[3] ?? ""));
        if (!old) continue;
        if (keyRoom !== created.room) continue;
        if (!(createdStart < keyEnd && createdEnd > keyStart)) continue;
        if (old.some((e) => e.id === created.id)) continue;
        qc.setQueryData<RoomEvent[]>(key, [...old, created]);
      }

      qc.invalidateQueries({ queryKey: ["room-events"] });
    },
  });
}

export function useDeleteRoomEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomEventsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["room-events"] }),
  });
}

export function useUpdateRoomEventParticipants() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, participants }: { id: string; participants: string[] }) =>
      roomEventsService.updateParticipants(id, participants),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["room-events"] }),
  });
}
