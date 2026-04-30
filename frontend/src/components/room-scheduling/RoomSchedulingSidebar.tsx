import { useMemo } from "react";
import { enUS, ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";

import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { UserSuggestion } from "@/services/users";
import UserEventFilter from "@/components/room-scheduling/UserEventFilter";

const ROOM_COLORS: Record<string, string> = {
  "1-009": "bg-primary",
  "1-007": "bg-accent",
};

type Props = {
  mode?: "desktop" | "mobile";
  open: boolean;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  room: string;
  rooms: readonly string[];
  onSelectRoom: (room: string) => void;
  onCreateClick: () => void;
  participantFilter: UserSuggestion | null;
  onParticipantFilterChange: (user: UserSuggestion | null) => void;
};

export default function RoomSchedulingSidebar(props: Props) {
  const { t, lang } = useLang();
  const locale = useMemo(() => (lang === "pt-BR" ? ptBR : enUS), [lang]);
  const mode = props.mode ?? "desktop";

  return (
    <aside
      className={cn(
        mode === "desktop"
          ? "hidden lg:block w-[320px] shrink-0 border-r border-border bg-background/60 backdrop-blur-sm"
          : "block w-full bg-background",
        mode === "desktop" && !props.open && "lg:w-[72px]"
      )}
      aria-label="Room scheduling sidebar"
      data-testid="sidebar"
    >
      <div className={cn("p-4", !props.open && "px-2")}>
        <Button
          onClick={props.onCreateClick}
          className={cn(
            "rounded-full shadow-sm",
            props.open ? "w-full justify-start" : "w-10 h-10 p-0 justify-center"
          )}
          data-testid="sidebar-create"
        >
          <Plus className={cn("h-4 w-4", props.open && "mr-2")} />
          {props.open ? t("rooms.createEvent") : null}
        </Button>

        {props.open ? (
          <div className="mt-4" data-testid="sidebar-mini-calendar">
            <Calendar
              mode="single"
              selected={props.selectedDate}
              onSelect={(d) => d && props.onSelectDate(d)}
              weekStartsOn={1}
              locale={locale}
            />
          </div>
        ) : null}

        {props.open ? (
          <div className="mt-4">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              {t("rooms.roomsLabel")}
            </div>
            <div className="space-y-2">
              {props.rooms.map((r) => (
                <label
                  key={r}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border border-border px-3 py-2 cursor-pointer",
                    props.room === r ? "bg-secondary" : "bg-background hover:bg-secondary/60"
                  )}
                  data-testid={`sidebar-room-${r}`}
                >
                  <input
                    type="radio"
                    name="room"
                    value={r}
                    checked={props.room === r}
                    onChange={() => props.onSelectRoom(r)}
                    className="accent-primary"
                  />
                  <span className={cn("h-2.5 w-2.5 rounded-full", ROOM_COLORS[r] || "bg-muted")} />
                  <span className="text-sm">{t("rooms.room")} {r}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {props.open ? (
          <div className="mt-4">
            <UserEventFilter
              value={props.participantFilter}
              onChange={props.onParticipantFilterChange}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
