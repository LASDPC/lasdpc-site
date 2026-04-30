import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { addDays, format, startOfWeek } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Server } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { clusterRequestsService } from "@/services/clusterRequests";

const DAYS = 28;

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function statusLabel(status: string, isPt: boolean) {
  if (status === "revoked") return isPt ? "Revogado" : "Revoked";
  return isPt ? "Aprovado" : "Approved";
}

const ClusterCalendarPage = () => {
  const { user } = useAuth();
  const { lang } = useLang();
  const isPt = lang === "pt-BR";
  const locale = isPt ? ptBR : enUS;
  const [rangeStart, setRangeStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const days = useMemo(
    () => Array.from({ length: DAYS }, (_, i) => addDays(rangeStart, i)),
    [rangeStart]
  );

  const rangeEnd = days[days.length - 1];
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["cluster-requests", "calendar", dateKey(rangeStart), dateKey(rangeEnd)],
    queryFn: () => clusterRequestsService.calendar(dateKey(rangeStart), dateKey(rangeEnd)),
    enabled: !!user,
  });

  if (!user) {
    return <Navigate to="/login" state={{ from: "/cluster-calendar" }} replace />;
  }

  return (
    <div className="mt-16 min-h-[calc(100vh-4rem)] py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Server size={20} />
              <span className="text-sm font-semibold uppercase tracking-wide">Clusters</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
              {isPt ? "Calendário de uso dos clusters" : "Cluster usage calendar"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setRangeStart(addDays(rangeStart, -DAYS))}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRangeStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              {isPt ? "Hoje" : "Today"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRangeStart(addDays(rangeStart, DAYS))}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays size={16} />
          {format(rangeStart, "dd MMM", { locale })} - {format(rangeEnd, "dd MMM yyyy", { locale })}
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {days.map((day) => {
            const key = dateKey(day);
            const dayEvents = events.filter((event) => event.start_date <= key && event.end_date >= key);
            return (
              <div key={key} className="min-h-36 bg-card p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{format(day, "EEE", { locale })}</p>
                    <p className="text-lg font-semibold text-foreground">{format(day, "d", { locale })}</p>
                  </div>
                  {format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? (
                    <Badge>{isPt ? "Hoje" : "Today"}</Badge>
                  ) : null}
                </div>
                {isLoading ? (
                  <div className="h-16 animate-pulse rounded-md bg-muted" />
                ) : dayEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{isPt ? "Livre" : "Free"}</p>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <div key={`${key}-${event.id}`} className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5">
                        <p className="truncate text-xs font-semibold text-foreground">{event.cluster_name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{event.user_name}</p>
                        <p className="mt-1 text-[11px] text-primary">{statusLabel(event.status, isPt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {isPt ? "Reservas aprovadas no período" : "Approved reservations in this period"}
          </h2>
          <div className="mt-3 divide-y divide-border">
            {events.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">{isPt ? "Nenhum uso agendado." : "No scheduled usage."}</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-medium text-foreground">{event.cluster_name}</p>
                    <p className="text-sm text-muted-foreground">{event.user_name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.start_date} - {event.end_date}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClusterCalendarPage;
