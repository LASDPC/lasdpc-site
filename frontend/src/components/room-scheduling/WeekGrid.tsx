import { format, isSameDay, startOfDay } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

import { useLang } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { END_HOUR, PX_PER_HOUR, START_HOUR, eventOverlapsDayWindow, minutesFromWindowStart } from "@/components/room-scheduling/eventPositioning";
import type { RoomEvent } from "@/services/roomEvents";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type Props = {
  weekStart: Date;
  events: RoomEvent[];
  currentUserId: string;
  onDelete: (id: string) => void;
  onEditGuests: (eventId: string) => void;
};

const WEEKDAYS_PT = ["SEG.", "TER.", "QUA.", "QUI.", "SEX.", "SAB.", "DOM."] as const;
const WEEKDAYS_EN = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

function tzLabel() {
  const mins = new Date().getTimezoneOffset(); // minutes behind UTC (positive in Americas)
  const hours = Math.round(Math.abs(mins) / 60);
  const sign = mins <= 0 ? "+" : "-";
  return `GMT${sign}${String(hours).padStart(2, "0")}`;
}

export default function WeekGrid(props: Props) {
  const { lang, t } = useLang();
  const locale = lang === "pt-BR" ? ptBR : enUS;
  const weekdays = lang === "pt-BR" ? WEEKDAYS_PT : WEEKDAYS_EN;
  const today = new Date();

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const dayStarts = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(props.weekStart);
    d.setDate(d.getDate() + i);
    return startOfDay(d);
  });

  const gridHeight = (END_HOUR - START_HOUR) * PX_PER_HOUR;

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[80px_repeat(7,minmax(140px,1fr))] border-b border-border bg-muted/40">
        <div
          className="px-2 py-2 text-[11px] text-muted-foreground flex items-center justify-center whitespace-nowrap"
          data-testid="tz-label"
        >
          {tzLabel()}
        </div>
        {dayStarts.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              className={cn("px-3 py-2 text-center border-l border-border/60")}
              data-testid={`day-header-${i}`}
            >
              <div className="text-[11px] tracking-wide text-muted-foreground">
                {weekdays[i]}
              </div>
              <div className="mt-1 flex items-center justify-center">
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                    isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                  )}
                  data-testid={isToday ? "today-badge" : undefined}
                >
                  {format(d, "d", { locale })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className="grid grid-cols-[80px_repeat(7,minmax(140px,1fr))]">
        {/* Time rail */}
        <div className="relative bg-muted/20 border-r border-border">
          <div style={{ height: gridHeight }} />
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 -translate-y-2 text-[11px] text-muted-foreground flex justify-center whitespace-nowrap"
              style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {dayStarts.map((dayStart, dayIndex) => {
          const windowStart = new Date(dayStart);
          windowStart.setHours(START_HOUR, 0, 0, 0);
          const windowEnd = new Date(dayStart);
          windowEnd.setHours(END_HOUR, 0, 0, 0);

          const dayEvents = props.events
            .map((ev) => ({ ev, s: new Date(ev.start_time), e: new Date(ev.end_time) }))
            .filter(({ s, e }) => isSameDay(s, dayStart) && eventOverlapsDayWindow(windowStart, windowEnd, s, e))
            .sort((a, b) => a.s.getTime() - b.s.getTime());

          return (
            <div
              key={dayStart.toISOString()}
              className="relative border-l border-border/60"
              style={{ height: gridHeight }}
              data-testid={`day-col-${dayIndex}`}
            >
              {/* Hour lines */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-border/40"
                  style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
                />
              ))}

              {/* Events */}
              {dayEvents.map(({ ev, s, e }) => {
                const topMin = Math.max(0, minutesFromWindowStart(windowStart, s));
                const endMin = Math.min((END_HOUR - START_HOUR) * 60, minutesFromWindowStart(windowStart, e));
                const heightMin = Math.max(18, endMin - topMin); // minimum click target
                const isOwner = ev.user_id === props.currentUserId;

                return (
                  <Popover key={ev.id}>
                    <PopoverTrigger asChild>
                      <motion.button
                        type="button"
                        className={cn(
                          "absolute left-1 right-1 rounded-lg border px-2 py-1 text-left",
                          "bg-primary/15 border-primary/40 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
                        )}
                        style={{
                          top: (topMin / 60) * PX_PER_HOUR,
                          height: (heightMin / 60) * PX_PER_HOUR,
                        }}
                        data-testid={`event-${ev.id}`}
                        aria-label={`Event ${ev.title}`}
                      >
                        <div className="text-xs font-semibold truncate text-foreground">{ev.title}</div>
                        <div className="text-[11px] truncate text-muted-foreground">{ev.user_name}</div>
                      </motion.button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72" align="start" data-testid={`event-popover-${ev.id}`}>
                      <div className="text-sm font-semibold">{ev.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{ev.user_name}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {format(s, "PPPP", { locale })} · {format(s, "HH:mm", { locale })}–{format(e, "HH:mm", { locale })}
                      </div>
                      {isOwner ? (
                        <div className="mt-3 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => props.onEditGuests(ev.id)}
                            data-testid={`edit-guests-${ev.id}`}
                          >
                            {t("rooms.editGuests")}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => props.onDelete(ev.id)}
                            data-testid={`delete-event-${ev.id}`}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : null}
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
