import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, startOfWeek } from "date-fns";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomEvents, useCreateRoomEvent, useDeleteRoomEvent, useUpdateRoomEvent } from "@/hooks/useRoomEvents";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRooms } from "@/hooks/useRooms";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CalendarDays, Trash2 } from "lucide-react";

import RoomSchedulingToolbar from "@/components/room-scheduling/RoomSchedulingToolbar";
import RoomSchedulingSidebar from "@/components/room-scheduling/RoomSchedulingSidebar";
import WeekGrid from "@/components/room-scheduling/WeekGrid";
import ParticipantsInput from "@/components/room-scheduling/ParticipantsInput";
import type { ParticipantDisplay } from "@/components/room-scheduling/ParticipantsInput";
import { AnimatePresence, motion } from "framer-motion";
import type { RoomEvent } from "@/services/roomEvents";
import type { UserSuggestion } from "@/services/users";

const ROOM_EVENTS_TTL_DAYS = 30;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatLocalDateYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function participantToken(participant: NonNullable<RoomEvent["participants"]>[number]) {
  if (participant.user_id) return `user:${participant.user_id}`;
  return participant.email || participant.name || "";
}

function participantDisplay(participant: NonNullable<RoomEvent["participants"]>[number]): ParticipantDisplay {
  return {
    token: participantToken(participant),
    id: participant.user_id,
    email: participant.email,
    name: participant.name,
    initials: participant.initials,
    photo: participant.photo,
    avatar: participant.avatar,
    usp_number: participant.usp_number,
  };
}

function eventMatchesUserFilter(event: RoomEvent, userFilter: UserSuggestion | null) {
  if (!userFilter) return true;
  const email = userFilter.email?.toLowerCase();
  if (event.user_id === userFilter.id) return true;
  return (event.participants || []).some((participant) => (
    participant.user_id === userFilter.id || (!!email && participant.email?.toLowerCase() === email)
  ));
}

const RoomSchedulingPage = () => {
  // Keep page palette consistent with site; structure mimics Google Calendar.
  // (Language strings come from i18n; avoid hardcoding labels.)
  const { t } = useLang();
  const { user } = useAuth();
  const { toast } = useToast();

  const [room, setRoom] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [navDirection, setNavDirection] = useState<-1 | 1>(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("08:00");
  const [formEnd, setFormEnd] = useState("09:00");
  const [formParticipants, setFormParticipants] = useState<string[]>([]);
  const [participantFilter, setParticipantFilter] = useState<UserSuggestion | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const editDateInputRef = useRef<HTMLInputElement | null>(null);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editParticipants, setEditParticipants] = useState<string[]>([]);
  const [editParticipantDetails, setEditParticipantDetails] = useState<Record<string, ParticipantDisplay>>({});
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("08:00");
  const [editEnd, setEditEnd] = useState("09:00");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const weekEndExclusive = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const weekEndInclusive = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const roomNames = useMemo(() => rooms.map((item) => item.name), [rooms]);

  useEffect(() => {
    if (roomNames.length === 0) return;
    if (!room || !roomNames.includes(room)) setRoom(roomNames[0]);
  }, [room, roomNames]);

  const { data: events = [], isLoading, isFetching } = useRoomEvents(
    room,
    weekStart.toISOString(),
    weekEndExclusive.toISOString()
  );

  const createMutation = useCreateRoomEvent();
  const deleteMutation = useDeleteRoomEvent();
  const updateEventMutation = useUpdateRoomEvent();

  const visibleEvents = useMemo(
    () => events.filter((event) => eventMatchesUserFilter(event, participantFilter)),
    [events, participantFilter]
  );

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">{t("infra.loginRequired")}</p>
      </div>
    );
  }

  if (roomsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (roomNames.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">{t("rooms.noRooms")}</p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!formTitle.trim() || !formDate || !formStart || !formEnd) return;

    const start_time = `${formDate}T${formStart}:00`;
    const end_time = `${formDate}T${formEnd}:00`;

    if (end_time <= start_time) {
      toast({ title: "Error", description: t("rooms.endAfterStart"), variant: "destructive" });
      return;
    }

    // Guard against creating events that would immediately be expired by retention policy.
    const endDt = new Date(end_time);
    const expiresAt = new Date(endDt);
    expiresAt.setDate(expiresAt.getDate() + ROOM_EVENTS_TTL_DAYS);
    if (expiresAt <= new Date()) {
      toast({ title: "Warning", description: t("rooms.ttlTooOld") });
      return;
    }

    try {
      await createMutation.mutateAsync({ room, title: formTitle, start_time, end_time, participants: formParticipants });
      setDialogOpen(false);
      setFormTitle("");
      setFormDate("");
      setFormStart("08:00");
      setFormEnd("09:00");
      setFormParticipants([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("conflict") || message.includes("409")) {
        toast({ title: "Error", description: t("rooms.overlapError"), variant: "destructive" });
      } else {
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    }
  };

  const openEditGuests = (eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    const participantDetails: Record<string, ParticipantDisplay> = {};
    const initial = (ev?.participants || [])
      .map((p) => {
        const token = participantToken(p);
        if (token) participantDetails[token] = participantDisplay(p);
        return token;
      })
      .filter(Boolean) as string[];
    setEditingEventId(eventId);
    setEditParticipants(initial);
    setEditParticipantDetails(participantDetails);
    setEditTitle(ev?.title || "");
    if (ev?.start_time) {
      setEditDate(ev.start_time.slice(0, 10));
      setEditStart(ev.start_time.slice(11, 16));
    }
    if (ev?.end_time) {
      setEditEnd(ev.end_time.slice(11, 16));
    }
    setEventDialogOpen(true);
  };

  const saveGuests = async () => {
    if (!editingEventId) return;
    try {
      const start_time = `${editDate}T${editStart}:00`;
      const end_time = `${editDate}T${editEnd}:00`;
      if (end_time <= start_time) {
        toast({ title: "Error", description: t("rooms.endAfterStart"), variant: "destructive" });
        return;
      }
      const endDt = new Date(end_time);
      const expiresAt = new Date(endDt);
      expiresAt.setDate(expiresAt.getDate() + ROOM_EVENTS_TTL_DAYS);
      if (expiresAt <= new Date()) {
        toast({ title: "Warning", description: t("rooms.ttlTooOld") });
        return;
      }
      await updateEventMutation.mutateAsync({
        id: editingEventId,
        data: { title: editTitle, participants: editParticipants, start_time, end_time },
      });
      setEventDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const goToWeekContaining = (d: Date) => {
    setSelectedDate(d);
    setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
  };

  const openCreateAt = (dayStart: Date, startHour: number) => {
    const clampedStart = Math.min(Math.max(startHour, 8), 21);
    const endHour = Math.min(clampedStart + 1, 22);
    setFormDate(formatLocalDateYYYYMMDD(dayStart));
    setFormStart(`${pad2(clampedStart)}:00`);
    setFormEnd(`${pad2(endHour)}:00`);
    setDialogOpen(true);
  };

  return (
    <div className="mt-16 min-h-[calc(100vh-4rem)]">
      <RoomSchedulingToolbar
        weekStart={weekStart}
        weekEndInclusive={weekEndInclusive}
        direction={navDirection}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => {
          const isDesktop =
            typeof window !== "undefined" && window.matchMedia
              ? window.matchMedia("(min-width: 1024px)").matches
              : false;
          if (isDesktop) setSidebarOpen((v) => !v);
          else setMobileSidebarOpen(true);
        }}
        onPrevWeek={() => {
          setNavDirection(-1);
          const d = addDays(weekStart, -7);
          setWeekStart(d);
          setSelectedDate(d);
        }}
        onNextWeek={() => {
          setNavDirection(1);
          const d = addDays(weekStart, 7);
          setWeekStart(d);
          setSelectedDate(d);
        }}
        onToday={() => {
          setNavDirection(1);
          goToWeekContaining(new Date());
        }}
      />

      <div className="container mx-auto px-4 py-6">
        <p className="text-muted-foreground mb-4">{t("rooms.heading")}</p>

        <div className="flex gap-4">
          <RoomSchedulingSidebar
            mode="desktop"
            open={sidebarOpen}
            selectedDate={selectedDate}
            onSelectDate={(d) => goToWeekContaining(d)}
            room={room}
            rooms={roomNames}
            onSelectRoom={(r) => setRoom(r)}
            onCreateClick={() => setDialogOpen(true)}
            participantFilter={participantFilter}
            onParticipantFilterChange={setParticipantFilter}
          />

          {/* Mobile sidebar as a sheet */}
          <div className="lg:hidden">
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetContent side="left" className="w-[340px] p-0" data-testid="mobile-sidebar">
                <RoomSchedulingSidebar
                  mode="mobile"
                  open={true}
                  selectedDate={selectedDate}
                  onSelectDate={(d) => {
                    goToWeekContaining(d);
                    setMobileSidebarOpen(false);
                  }}
                  room={room}
                  rooms={roomNames}
                  onSelectRoom={(r) => setRoom(r)}
                  onCreateClick={() => setDialogOpen(true)}
                  participantFilter={participantFilter}
                  onParticipantFilterChange={setParticipantFilter}
                />
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex-1 min-w-0">
            <div className="relative">
              {/* Keep the grid mounted to avoid layout collapse (footer popping in) while new week data fetches. */}
              {isLoading && events.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : (
                <AnimatePresence mode="sync" initial={false}>
                  <motion.div
                    key={weekStart.toISOString()}
                    initial={{ opacity: 0, x: navDirection * 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -navDirection * 24 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  data-testid="week-grid-anim"
                >
                  <WeekGrid
                    events={visibleEvents}
                    weekStart={weekStart}
                    currentUserId={user.id}
                    onDelete={handleDelete}
                    onEditGuests={openEditGuests}
                    onCreateAt={({ dayStart, startHour }) => openCreateAt(dayStart, startHour)}
                  />
                </motion.div>
              </AnimatePresence>
            )}

              {isFetching ? (
                <div
                  className="pointer-events-none absolute inset-0 rounded-xl bg-background/30 backdrop-blur-[1px] opacity-0 animate-in fade-in duration-150"
                  aria-hidden="true"
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Create dialog (triggered from toolbar/sidebar) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rooms.createEvent")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("rooms.eventTitle")}</Label>
              <Input
                data-testid="event-title-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("rooms.participants")}</Label>
              <ParticipantsInput
                value={formParticipants}
                onChange={setFormParticipants}
                placeholder={t("rooms.participantsPlaceholder")}
                data-testid="participants-field"
              />
            </div>
            <div>
              <Label>{t("rooms.room")}</Label>
              <select
                className="w-full border rounded-md p-2 bg-background text-foreground"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                data-testid="event-room-select"
              >
                {roomNames.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t("rooms.date")}</Label>
              <div className="relative">
                <Input
                  ref={dateInputRef}
                  type="date"
                  className="pr-10 hide-native-picker"
                  data-testid="event-date-input"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Open date picker"
                  onClick={() => {
                    const el = dateInputRef.current;
                    if (!el) return;
                    // Prefer the native picker when available.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const anyEl = el as any;
                    if (typeof anyEl.showPicker === "function") anyEl.showPicker();
                    else {
                      el.focus();
                      el.click();
                    }
                  }}
                  data-testid="event-date-icon"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("rooms.startTime")}</Label>
                <Input
                  type="time"
                  data-testid="event-start-input"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                />
              </div>
              <div>
                <Label>{t("rooms.endTime")}</Label>
                <Input
                  type="time"
                  data-testid="event-end-input"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t("rooms.cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="submit-event-btn">
                {t("rooms.submit")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event details dialog (participants editing + UI mocks for name/date) */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader className="pr-10">
            <DialogTitle>{t("rooms.editGuests")}</DialogTitle>
          </DialogHeader>

          {editingEventId ? (
            <button
              type="button"
              className="absolute right-12 top-4 text-destructive hover:opacity-80"
              aria-label="Delete event"
              data-testid="event-dialog-delete"
              onClick={async () => {
                setDeleteTargetId(editingEventId);
                setDeleteConfirmOpen(true);
              }}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : null}

          <div className="space-y-4">
            <div>
              <Label>{t("rooms.participants")}</Label>
              <ParticipantsInput
                value={editParticipants}
                onChange={setEditParticipants}
                knownParticipants={editParticipantDetails}
                placeholder={t("rooms.participantsPlaceholder")}
                data-testid="edit-participants-field"
              />
            </div>
            <div>
              <Label>{t("rooms.eventTitle")}</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={t("rooms.eventTitle")}
                data-testid="edit-title-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("rooms.date")}</Label>
                <div className="relative">
                  <Input
                    ref={editDateInputRef}
                    type="date"
                    className="pr-10 hide-native-picker"
                    data-testid="edit-date-input"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Open date picker"
                    onClick={() => {
                      const el = editDateInputRef.current;
                      if (!el) return;
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const anyEl = el as any;
                      if (typeof anyEl.showPicker === "function") anyEl.showPicker();
                      else {
                        el.focus();
                        el.click();
                      }
                    }}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <Label>{t("rooms.startTime")}</Label>
                <Input
                  type="time"
                  data-testid="edit-start-input"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>{t("rooms.endTime")}</Label>
              <Input
                type="time"
                data-testid="edit-end-input"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
                {t("rooms.cancel")}
              </Button>
              <Button onClick={saveGuests} disabled={updateEventMutation.isPending} data-testid="save-guests-btn">
                {t("rooms.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation (replaces browser confirm) */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("rooms.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("rooms.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel">
              {t("rooms.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="delete-confirm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTargetId) return;
                await handleDelete(deleteTargetId);
                setDeleteConfirmOpen(false);
                setEventDialogOpen(false);
                setDeleteTargetId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoomSchedulingPage;
