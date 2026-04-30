import { useState, useMemo } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomEvents, useCreateRoomEvent, useDeleteRoomEvent } from "@/hooks/useRoomEvents";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

const ROOMS = ["1-009", "1-007"] as const;
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8..22

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTime(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

const WEEKDAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const RoomSchedulingPage = () => {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { toast } = useToast();

  const [room, setRoom] = useState<string>(ROOMS[0]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("08:00");
  const [formEnd, setFormEnd] = useState("09:00");

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  const { data: events = [], isLoading } = useRoomEvents(
    room,
    weekStart.toISOString(),
    weekEnd.toISOString()
  );

  const createMutation = useCreateRoomEvent();
  const deleteMutation = useDeleteRoomEvent();

  const weekdays = lang === "pt-BR" ? WEEKDAYS_PT : WEEKDAYS_EN;

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

  const getEventsForDayHour = (dayIndex: number, hour: number) => {
    const dayDate = formatDate(addDays(weekStart, dayIndex));
    return events.filter((ev) => {
      const evStart = new Date(ev.start_time);
      const evEnd = new Date(ev.end_time);
      const slotStart = new Date(`${dayDate}T${formatTime(hour)}:00`);
      const slotEnd = new Date(`${dayDate}T${formatTime(hour + 1)}:00`);
      return evStart < slotEnd && evEnd > slotStart;
    });
  };

  const isEventStart = (ev: { start_time: string }, dayIndex: number, hour: number) => {
    const evStart = new Date(ev.start_time);
    return evStart.getHours() === hour && formatDate(evStart) === formatDate(addDays(weekStart, dayIndex));
  };

  const getEventSpan = (ev: { start_time: string; end_time: string }) => {
    const start = new Date(ev.start_time);
    const end = new Date(ev.end_time);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  };

  return (
    <div className="container mx-auto px-4 py-12 mt-16">
      <h1 className="text-3xl font-bold text-foreground mb-2">{t("rooms.title")}</h1>
      <p className="text-muted-foreground mb-6">{t("rooms.heading")}</p>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Room toggle */}
        <div className="flex gap-2">
          {ROOMS.map((r) => (
            <Button
              key={r}
              variant={room === r ? "default" : "outline"}
              onClick={() => setRoom(r)}
              data-testid={`room-toggle-${r}`}
            >
              {t("rooms.room")} {r}
            </Button>
          ))}
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            {t("rooms.today")}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {formatDate(weekStart)} — {formatDate(addDays(weekStart, 6))}
          </span>
        </div>

        {/* Create button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-event-btn">
              <Plus className="h-4 w-4 mr-2" />
              {t("rooms.createEvent")}
            </Button>
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
                <Label>{lang === "pt-BR" ? "Data" : "Date"}</Label>
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

      {/* Calendar grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="w-16 p-2 border-b border-r bg-muted text-xs text-muted-foreground" />
                {weekdays.map((day, i) => {
                  const d = addDays(weekStart, i);
                  const isToday = formatDate(d) === formatDate(new Date());
                  return (
                    <th
                      key={i}
                      className={`p-2 border-b text-center text-sm font-medium ${isToday ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      {day} {d.getDate()}/{d.getMonth() + 1}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour} className="h-12">
                  <td className="p-1 border-r text-xs text-muted-foreground text-center align-top bg-muted">
                    {formatTime(hour)}
                  </td>
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const slotEvents = getEventsForDayHour(dayIndex, hour);
                    return (
                      <td key={dayIndex} className="border relative p-0" data-testid={`cell-${dayIndex}-${hour}`}>
                        {slotEvents.map((ev) => {
                          if (!isEventStart(ev, dayIndex, hour)) return null;
                          const span = getEventSpan(ev);
                          const isOwner = ev.user_id === user.id;
                          return (
                            <div
                              key={ev.id}
                              className="absolute inset-x-0 mx-0.5 rounded bg-primary/20 border border-primary/40 px-1 py-0.5 text-xs overflow-hidden z-10"
                              style={{ height: `${span * 3}rem`, top: 0 }}
                              data-testid={`event-${ev.id}`}
                            >
                              <div className="font-semibold truncate">{ev.title}</div>
                              <div className="text-muted-foreground truncate">{ev.user_name}</div>
                              {isOwner && (
                                <button
                                  className="absolute top-0.5 right-0.5 hover:text-destructive"
                                  onClick={() => handleDelete(ev.id)}
                                  data-testid={`delete-event-${ev.id}`}
                                  aria-label="Delete event"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RoomSchedulingPage;
