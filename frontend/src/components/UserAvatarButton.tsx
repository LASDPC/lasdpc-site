import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notificationsService, type Notification } from "@/services/notifications";
import { Bell, CalendarDays, CheckCircle, XCircle, X, User, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { mediaUrl } from "@/lib/media";

const MAX_NOTIFICATION_COUNT = 99;

function notificationCountLabel(count: number) {
  return count > MAX_NOTIFICATION_COUNT ? `${MAX_NOTIFICATION_COUNT}+` : String(count);
}

function formatMsg(n: Notification, template: string) {
  return template
    .replace("{cluster}", n.cluster_name || "")
    .replace("{start}", n.start_date || "")
    .replace("{end}", n.end_date || "");
}

function formatRoomEventMsg(n: Notification, template: string, locale: string) {
  const start = n.start_time ? new Date(n.start_time).toLocaleString(locale) : "";
  return template
    .replace("{title}", n.event_title || "")
    .replace("{room}", n.room || "")
    .replace("{start}", start)
    .replace("{actor}", n.actor_name || "");
}

function notificationMessage(n: Notification, t: (key: string) => string, locale: string) {
  const isRoomEvent = n.type === "room_event_invite";
  const isApproved = n.type === "cluster_approved";
  const isRevoked = n.type === "cluster_revoked";

  if (isRoomEvent) {
    return formatRoomEventMsg(n, t("notif.roomEventInvite"), locale);
  }

  return formatMsg(n, t(isApproved ? "notif.approved" : isRevoked ? "notif.revoked" : "notif.rejected"));
}

function NotificationTypeIcon({ type }: { type: Notification["type"] }) {
  if (type === "room_event_invite") {
    return <CalendarDays size={16} className="text-primary" />;
  }

  if (type === "cluster_approved") {
    return <CheckCircle size={16} className="text-green-500" />;
  }

  return <XCircle size={16} className="text-red-500" />;
}

function NotificationsDialog({
  open,
  onOpenChange,
  notifications,
  onDismiss,
  dismissing,
  t,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Notification[];
  onDismiss: (id: string) => void;
  dismissing: boolean;
  t: (key: string) => string;
  locale: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t("notif.title")}
          </DialogTitle>
          <DialogDescription className="sr-only">{t("notif.description")}</DialogDescription>
        </DialogHeader>

        {notifications.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            {t("notif.empty")}
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">
            {notifications.map((n) => {
              const msg = notificationMessage(n, t, locale);

              return (
                <div key={n.id} className="flex gap-3 border-b border-border px-5 py-3 last:border-0">
                  <div className="shrink-0 pt-0.5">
                    <NotificationTypeIcon type={n.type} />
                  </div>
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">{msg}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    disabled={dismissing}
                    aria-label={`${t("notif.dismiss")}: ${msg}`}
                    onClick={() => onDismiss(n.id)}
                  >
                    <X size={13} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const UserAvatarButton = () => {
  const { user, isAdmin, logout } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notificationsQueryKey = ["notifications", user?.id];
  const { data: notifications = [] } = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: notificationsService.list,
    enabled: !!user,
    refetchInterval: 30000,
  });

  const dismiss = useMutation({
    mutationFn: notificationsService.dismiss,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey }),
  });

  if (!user) {
    return (
      <button
        onClick={() => navigate("/login")}
        className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
        aria-label={t("auth.login")}
      >
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User size={16} />
          </AvatarFallback>
        </Avatar>
      </button>
    );
  }

  const notificationCount = notifications.length;
  const formattedNotificationCount = notificationCountLabel(notificationCount);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={
              notificationCount > 0
                ? `${user.name}, ${formattedNotificationCount} ${t("notif.title")}`
                : user.name
            }
          >
            <Avatar className="h-8 w-8 cursor-pointer">
              {(user.photo || user.avatar) && (
                <AvatarImage src={mediaUrl(user.photo || user.avatar)} alt={user.name} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            {notificationCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground shadow-sm">
                {formattedNotificationCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              <div className="flex gap-1 mt-1">
                <Badge variant="secondary" className="w-fit text-[10px] capitalize">
                  {user.role.replace("_", " ")}
                </Badge>
                {isAdmin && (
                  <Badge variant="default" className="w-fit text-[10px]">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => setNotificationsOpen(true)}
            className="cursor-pointer"
          >
            <Bell className="mr-2 h-4 w-4" />
            <span className="flex-1">{t("notif.title")}</span>
            {notificationCount > 0 && (
              <span className="ml-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold leading-none text-destructive-foreground">
                {formattedNotificationCount}
              </span>
            )}
          </DropdownMenuItem>

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate("/admin")}
                className="text-primary font-semibold cursor-pointer"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {t("menu.adminPanel")}
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => navigate(`/profile/${user.id}`)}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            {t("menu.profile")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate("/settings")}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            {t("menu.settings")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("menu.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NotificationsDialog
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications}
        onDismiss={(id) => dismiss.mutate(id)}
        dismissing={dismiss.isPending}
        t={t}
        locale={lang}
      />
    </>
  );
};

export default UserAvatarButton;
