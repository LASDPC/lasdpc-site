import { format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import type { Locale } from "date-fns";

import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  weekStart: Date;
  weekEndInclusive: Date;
  direction: -1 | 1;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

function formatPeriodLabel(start: Date, endInclusive: Date, locale: Locale) {
  const sameMonth = start.getMonth() === endInclusive.getMonth() && start.getFullYear() === endInclusive.getFullYear();
  if (sameMonth) return format(start, "MMM yyyy", { locale });
  // Google Calendar shows a compact "Apr – May 2026"-style label.
  const startPart = format(start, "MMM", { locale });
  const endPart = format(endInclusive, "MMM yyyy", { locale });
  return `${startPart} \u2013 ${endPart}`;
}

export default function RoomSchedulingToolbar(props: Props) {
  const { t, lang } = useLang();
  const locale = lang === "pt-BR" ? ptBR : enUS;

  const label = formatPeriodLabel(props.weekStart, props.weekEndInclusive, locale);

  return (
    <div className="sticky top-16 z-40 glass-surface border-b border-border">
      <div className="container mx-auto px-4 h-14 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={props.onToggleSidebar}
          aria-label="Toggle sidebar"
          data-testid="toolbar-sidebar-toggle"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="font-display font-semibold text-sm sm:text-base truncate">
            {t("rooms.title")}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <Button variant="outline" onClick={props.onToday} data-testid="toolbar-today">
            {t("rooms.today")}
          </Button>
          <Button variant="outline" size="icon" onClick={props.onPrevWeek} aria-label="Previous week" data-testid="toolbar-prev">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={props.onNextWeek} aria-label="Next week" data-testid="toolbar-next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-muted-foreground ml-2 truncate" data-testid="toolbar-period-label">
          {label}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div
            className={cn(
              "px-3 py-1.5 rounded-full border border-border bg-background text-xs font-medium text-foreground",
              "hidden sm:inline-flex"
            )}
            aria-label="View selector"
            data-testid="toolbar-view-pill"
          >
            {t("rooms.viewWeek")}
          </div>
          <div className={cn("text-xs text-muted-foreground hidden lg:block")}>
            {props.sidebarOpen ? "" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
