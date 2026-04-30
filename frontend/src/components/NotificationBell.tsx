import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { notificationsService, type Notification } from "@/services/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, CalendarDays, CheckCircle, XCircle, X } from "lucide-react";

function formatMsg(n: Notification, template: string) {
  return template
    .replace("{cluster}", n.cluster_name || "")
    .replace("{start}", n.start_date || "")
    .replace("{end}", n.end_date || "");
}

function formatRoomEventMsg(n: Notification, template: string) {
  const start = n.start_time ? new Date(n.start_time).toLocaleString() : "";
  return template
    .replace("{title}", n.event_title || "")
    .replace("{room}", n.room || "")
    .replace("{start}", start)
    .replace("{actor}", n.actor_name || "");
}

const NotificationBell = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsService.list,
    enabled: !!user,
    refetchInterval: 30000,
  });

  const dismiss = useMutation({
    mutationFn: notificationsService.dismiss,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!user) return null;

  const count = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-md hover:bg-secondary text-foreground transition-all duration-200 active:scale-90"
          aria-label={t("notif.title")}
        >
          <Bell size={18} />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
              {count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t("notif.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            {t("notif.empty")}
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {notifications.map((n) => {
              const isRoomEvent = n.type === "room_event_invite";
              const isApproved = n.type === "cluster_approved";
              const isRevoked = n.type === "cluster_revoked";
              const msg = isRoomEvent
                ? formatRoomEventMsg(n, t("notif.roomEventInvite"))
                : formatMsg(n, t(isApproved ? "notif.approved" : isRevoked ? "notif.revoked" : "notif.rejected"));
              return (
                <div key={n.id} className="px-3 py-2.5 border-b border-border last:border-0 flex gap-2">
                  <div className="shrink-0 pt-0.5">
                    {isRoomEvent ? (
                      <CalendarDays size={16} className="text-primary" />
                    ) : isApproved ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <XCircle size={16} className="text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{msg}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => dismiss.mutate(n.id)}
                  >
                    <X size={12} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
