import { useMemo, useState } from "react";
import { addDays, startOfWeek } from "date-fns";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomEvents, useCreateRoomEvent, useDeleteRoomEvent } from "@/hooks/useRoomEvents";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import RoomSchedulingToolbar from "@/components/room-scheduling/RoomSchedulingToolbar";
import RoomSchedulingSidebar from "@/components/room-scheduling/RoomSchedulingSidebar";
import WeekGrid from "@/components/room-scheduling/WeekGrid";
import { AnimatePresence, motion } from "framer-motion";

const ROOMS = ["1-009", "1-007"] as const;

const RoomSchedulingPage = () => {
  // Keep page palette consistent with site; structure mimics Google Calendar.
  // (Language strings come from i18n; avoid hardcoding labels.)
  const { t } = useLang();
  const { user } = useAuth();
  const { toast } = useToast();

  const [room, setRoom] = useState<string>(ROOMS[0]);
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

  const weekEndExclusive = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const weekEndInclusive = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const { data: events = [], isLoading, isFetching } = useRoomEvents(
    room,
    weekStart.toISOString(),
    weekEndExclusive.toISOString()
  );

  const createMutation = useCreateRoomEvent();
  const deleteMutation = useDeleteRoomEvent();

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">{t("infra.loginRequired")}</p>
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

    try {
      await createMutation.mutateAsync({ room, title: formTitle, start_time, end_time });
      setDialogOpen(false);
      setFormTitle("");
      setFormDate("");
      setFormStart("08:00");
      setFormEnd("09:00");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("conflict") || message.includes("409")) {
        toast({ title: "Error", description: t("rooms.overlapError"), variant: "destructive" });
      } else {
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("rooms.deleteConfirm"))) return;
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
            rooms={ROOMS}
            onSelectRoom={(r) => setRoom(r)}
            onCreateClick={() => setDialogOpen(true)}
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
                  rooms={ROOMS}
                  onSelectRoom={(r) => setRoom(r)}
                  onCreateClick={() => setDialogOpen(true)}
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
                    <WeekGrid events={events} weekStart={weekStart} currentUserId={user.id} onDelete={handleDelete} />
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
              <Label>{t("rooms.room")}</Label>
              <select
                className="w-full border rounded-md p-2 bg-background text-foreground"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                data-testid="event-room-select"
              >
                {ROOMS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t("rooms.date")}</Label>
              <Input
                type="date"
                data-testid="event-date-input"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
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
    </div>
  );
};

export default RoomSchedulingPage;
