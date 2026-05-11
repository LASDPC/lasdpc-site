import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { addDays, format, startOfWeek } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CalendarDays,
  CheckCircle,
  Clock,
  Database,
  Edit3,
  FileText,
  KeyRound,
  LayoutDashboard,
  Newspaper,
  Plus,
  Server,
  Shield,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { useBlog } from "@/hooks/useBlog";
import { useDocs } from "@/hooks/useDocs";
import { useInfrastructure } from "@/hooks/useInfrastructure";
import { useDocentes, useStudents } from "@/hooks/usePeople";
import { useProjects } from "@/hooks/useProjects";
import { usePublications } from "@/hooks/usePublications";
import { useCreateRoom, useDeleteRoom, useRooms } from "@/hooks/useRooms";
import { authService, type User } from "@/services/auth";
import { clusterRequestsService, type ClusterRequest } from "@/services/clusterRequests";
import { roomEventsService, type RoomEvent } from "@/services/roomEvents";
import { usersService } from "@/services/users";

interface LgpdRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  request_type: string;
  status: string;
  reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

type ResourceRow = {
  id: string;
  title: string;
  detail: string;
  editTo: string;
};

const roleLabels: Record<string, { pt: string; en: string }> = {
  docente: { pt: "Docente", en: "Faculty" },
  aluno_ativo: { pt: "Aluno ativo", en: "Active student" },
  alumni: { pt: "Egresso", en: "Alumni" },
};

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-700 border-green-500/20",
  rejected: "bg-red-500/10 text-red-700 border-red-500/20",
  expired: "bg-muted text-muted-foreground border-border",
  revoked: "bg-destructive/10 text-destructive border-destructive/20",
  active: "bg-green-500/10 text-green-700 border-green-500/20",
  scheduled: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  ended: "bg-muted text-muted-foreground border-border",
};

function invalidateAdminData(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["users"] });
  queryClient.invalidateQueries({ queryKey: ["cluster-requests"] });
  queryClient.invalidateQueries({ queryKey: ["lgpd-requests"] });
  queryClient.invalidateQueries({ queryKey: ["room-events"] });
  queryClient.invalidateQueries({ queryKey: ["rooms"] });
}

function dateOnly(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

function statusLabel(status: string, isPt: boolean) {
  const labels: Record<string, { pt: string; en: string }> = {
    pending: { pt: "Pendente", en: "Pending" },
    approved: { pt: "Aprovado", en: "Approved" },
    rejected: { pt: "Recusado", en: "Rejected" },
    expired: { pt: "Expirado", en: "Expired" },
    revoked: { pt: "Revogado", en: "Revoked" },
    active: { pt: "Ativo", en: "Active" },
    scheduled: { pt: "Agendado", en: "Scheduled" },
    ended: { pt: "Encerrado", en: "Ended" },
  };
  return labels[status]?.[isPt ? "pt" : "en"] ?? status;
}

function requestAccessState(req: ClusterRequest) {
  if (req.status !== "approved") return req.status;
  const start = new Date(`${dateOnly(req.access_starts_at || req.start_date)}T00:00:00`);
  const end = new Date(`${dateOnly(req.access_ends_at || req.end_date)}T23:59:59`);
  const now = new Date();
  if (now < start) return "scheduled";
  if (now > end) return "ended";
  return "active";
}

function StatusBadge({ status, isPt }: { status: string; isPt: boolean }) {
  return (
    <Badge variant="outline" className={statusStyles[status] ?? "border-border"}>
      {statusLabel(status, isPt)}
    </Badge>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function ResourceSection({
  title,
  addLabel,
  addTo,
  rows,
  editLabel,
}: {
  title: string;
  addLabel: string;
  addTo: string;
  rows: ResourceRow[];
  editLabel: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
        <Button asChild size="sm">
          <Link to={addTo}>
            <Plus size={16} />
            {addLabel}
          </Link>
        </Button>
      </div>
      {rows.length === 0 ? (
        <div className="p-4">
          <EmptyState text="-" />
        </div>
      ) : (
        <Table>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{row.title}</p>
                  <p className="text-xs text-muted-foreground">{row.detail}</p>
                </TableCell>
                <TableCell className="w-24 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={row.editTo}>
                      <Edit3 size={14} />
                      {editLabel}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

function CalendarList({
  title,
  icon,
  items,
  isPt,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{ id: string; when: string; title: string; detail: string; status?: string }>;
  isPt: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="text-primary">{icon}</span>
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <div className="p-4">
            <EmptyState text="Sem eventos no período" />
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[160px_1fr_auto] sm:items-center">
              <p className="text-sm font-medium text-foreground">{item.when}</p>
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
              {item.status ? <StatusBadge status={item.status} isPt={isPt} /> : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function RoomManagement({
  rooms,
  newRoomName,
  setNewRoomName,
  onCreate,
  onDelete,
  creating,
  deleting,
  isPt,
}: {
  rooms: Array<{ id: string; name: string }>;
  newRoomName: string;
  setNewRoomName: (value: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  creating: boolean;
  deleting: boolean;
  isPt: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-card xl:col-span-2">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">{isPt ? "Salas de reserva" : "Reservation rooms"}</h3>
        </div>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="divide-y divide-border rounded-lg border border-border">
          {rooms.length === 0 ? (
            <div className="p-4"><EmptyState text={isPt ? "Nenhuma sala cadastrada." : "No rooms registered."} /></div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-medium text-foreground">{room.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={deleting}
                  onClick={() => onDelete(room.id)}
                  aria-label={isPt ? `Remover sala ${room.name}` : `Delete room ${room.name}`}
                >
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
        <form
          className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate();
          }}
        >
          <label className="text-sm font-medium text-foreground" htmlFor="admin-new-room">
            {isPt ? "Nova sala" : "New room"}
          </label>
          <Input
            id="admin-new-room"
            value={newRoomName}
            onChange={(event) => setNewRoomName(event.target.value)}
            placeholder="1-009"
          />
          <Button type="submit" disabled={creating || !newRoomName.trim()} className="w-full">
            <Plus size={14} />
            {isPt ? "Cadastrar sala" : "Add room"}
          </Button>
        </form>
      </div>
    </section>
  );
}

function editUserPath(user: User) {
  return user.role === "docente"
    ? `/admin/edit/docente/${user.id}`
    : `/admin/edit/student/${user.id}`;
}

const AdminDashboardPage = () => {
  const { isAdmin } = useAuth();
  const { lang } = useLang();
  const isPt = lang === "pt-BR";
  const locale = isPt ? ptBR : enUS;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newRoomName, setNewRoomName] = useState("");

  const rangeStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const rangeEnd = useMemo(() => addDays(rangeStart, 21), [rangeStart]);
  const rangeStartIso = rangeStart.toISOString();
  const rangeEndIso = rangeEnd.toISOString();
  const rangeStartDate = format(rangeStart, "yyyy-MM-dd");
  const rangeEndDate = format(rangeEnd, "yyyy-MM-dd");

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => usersService.list(),
    enabled: isAdmin,
  });
  const { data: pendingUsers = [] } = useQuery({
    queryKey: ["users", "pending"],
    queryFn: authService.listPending,
    enabled: isAdmin,
  });
  const { data: clusterRequests = [] } = useQuery({
    queryKey: ["cluster-requests", "all"],
    queryFn: () => clusterRequestsService.list(),
    enabled: isAdmin,
  });
  const { data: pendingClusters = [] } = useQuery({
    queryKey: ["cluster-requests", "pending"],
    queryFn: clusterRequestsService.pending,
    enabled: isAdmin,
  });
  const { data: lgpdRequests = [] } = useQuery<LgpdRequest[]>({
    queryKey: ["lgpd-requests"],
    queryFn: authService.listLgpdRequests as () => Promise<LgpdRequest[]>,
    enabled: isAdmin,
  });
  const { data: labEvents = [] } = useQuery({
    queryKey: ["room-events", "admin", rangeStartIso, rangeEndIso],
    queryFn: () => roomEventsService.adminList(rangeStartIso, rangeEndIso),
    enabled: isAdmin,
  });
  const { data: clusterCalendar = [] } = useQuery({
    queryKey: ["cluster-requests", "calendar", rangeStartDate, rangeEndDate],
    queryFn: () => clusterRequestsService.calendar(rangeStartDate, rangeEndDate),
    enabled: isAdmin,
  });

  const { data: blog = [] } = useBlog();
  const { data: projects = [] } = useProjects();
  const { data: publications = [] } = usePublications();
  const { data: docentes = [] } = useDocentes();
  const { data: students = [] } = useStudents();
  const { data: docs = [] } = useDocs();
  const { data: infra } = useInfrastructure();
  const { data: rooms = [] } = useRooms();
  const createRoom = useCreateRoom();
  const deleteRoom = useDeleteRoom();

  const approveUser = useMutation({
    mutationFn: (id: string) => authService.approveUser(id),
    onSuccess: () => {
      invalidateAdminData(queryClient);
      toast.success(isPt ? "Usuário aprovado." : "User approved.");
    },
  });

  const rejectUser = useMutation({
    mutationFn: (id: string) => authService.rejectUser(id),
    onSuccess: () => {
      invalidateAdminData(queryClient);
      toast.success(isPt ? "Solicitação recusada." : "Request rejected.");
    },
  });

  const approveCluster = useMutation({
    mutationFn: (id: string) => clusterRequestsService.approve(id),
    onSuccess: (req) => {
      invalidateAdminData(queryClient);
      toast.success(
        isPt
          ? `Acesso aprovado: ${req.access_key ?? ""}`
          : `Access approved: ${req.access_key ?? ""}`
      );
    },
  });

  const rejectCluster = useMutation({
    mutationFn: (id: string) => clusterRequestsService.reject(id),
    onSuccess: () => {
      invalidateAdminData(queryClient);
      toast.success(isPt ? "Pré-reserva recusada." : "Pre-reservation rejected.");
    },
  });

  const revokeCluster = useMutation({
    mutationFn: (id: string) => clusterRequestsService.revoke(id),
    onSuccess: () => {
      invalidateAdminData(queryClient);
      toast.success(isPt ? "Acesso revogado." : "Access revoked.");
    },
  });

  const completeLgpd = useMutation({
    mutationFn: (id: string) => authService.completeLgpdRequest(id),
    onSuccess: () => {
      invalidateAdminData(queryClient);
      toast.success(isPt ? "Solicitação LGPD concluída." : "LGPD request completed.");
    },
  });

  const rejectLgpd = useMutation({
    mutationFn: (id: string) => authService.rejectLgpdRequest(id),
    onSuccess: () => {
      invalidateAdminData(queryClient);
      toast.success(isPt ? "Solicitação LGPD recusada." : "LGPD request rejected.");
    },
  });

  const handleCreateRoom = () => {
    const name = newRoomName.trim();
    if (!name) return;
    createRoom.mutate(name, {
      onSuccess: () => {
        setNewRoomName("");
        invalidateAdminData(queryClient);
        toast.success(isPt ? "Sala cadastrada." : "Room added.");
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "";
        toast.error(message || (isPt ? "Erro ao cadastrar sala." : "Failed to add room."));
      },
    });
  };

  const handleDeleteRoom = (id: string) => {
    deleteRoom.mutate(id, {
      onSuccess: () => {
        invalidateAdminData(queryClient);
        toast.success(isPt ? "Sala removida." : "Room deleted.");
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "";
        toast.error(message || (isPt ? "Nao foi possivel remover a sala." : "Could not delete room."));
      },
    });
  };

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const activeAccess = clusterRequests.filter((req) => req.status === "approved");
  const pendingTotal = pendingUsers.length + pendingClusters.length + lgpdRequests.length;

  const labCalendarItems = labEvents.map((event: RoomEvent) => ({
    id: event.id,
    when: `${format(new Date(event.start_time), "dd/MM HH:mm")} - ${format(new Date(event.end_time), "HH:mm")}`,
    title: `${event.room} · ${event.title}`,
    detail: event.user_name,
  }));

  const clusterCalendarItems = clusterCalendar.map((event) => ({
    id: event.id,
    when: `${formatDate(event.start_date)} - ${formatDate(event.end_date)}`,
    title: event.cluster_name,
    detail: event.user_name,
    status: event.status,
  }));

  return (
    <div className="py-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <LayoutDashboard size={22} />
              <span className="text-sm font-semibold uppercase tracking-wide">Admin</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
              {isPt ? "Painel administrativo" : "Admin dashboard"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/edit/docente")}>
              <UserPlus size={16} />
              {isPt ? "Novo docente" : "New faculty"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/edit/student")}>
              <UserPlus size={16} />
              {isPt ? "Novo aluno" : "New student"}
            </Button>
            <Button onClick={() => navigate("/admin/edit/blog")}>
              <Plus size={16} />
              {isPt ? "Novo conteúdo" : "New content"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={<Clock size={20} />} label={isPt ? "Pendências" : "Pending"} value={pendingTotal} />
          <StatTile icon={<Users size={20} />} label={isPt ? "Usuários" : "Users"} value={allUsers.length} />
          <StatTile icon={<Server size={20} />} label={isPt ? "Acessos ativos" : "Approved access"} value={activeAccess.length} />
          <StatTile icon={<CalendarDays size={20} />} label={isPt ? "Eventos no calendário" : "Calendar events"} value={labEvents.length + clusterCalendar.length} />
        </div>

        <Tabs defaultValue="requests" className="mt-8">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="requests">{isPt ? "Solicitações" : "Requests"}</TabsTrigger>
            <TabsTrigger value="access">{isPt ? "Acessos" : "Access"}</TabsTrigger>
            <TabsTrigger value="calendars">{isPt ? "Calendários" : "Calendars"}</TabsTrigger>
            <TabsTrigger value="users">{isPt ? "Usuários" : "Users"}</TabsTrigger>
            <TabsTrigger value="content">{isPt ? "Conteúdo" : "Content"}</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6 space-y-6">
            <section className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Users size={18} className="text-primary" />
                <h2 className="font-display text-lg font-semibold">{isPt ? "Usuários pendentes" : "Pending users"}</h2>
              </div>
              {pendingUsers.length === 0 ? (
                <div className="p-4"><EmptyState text={isPt ? "Nenhum usuário pendente." : "No pending users."} /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isPt ? "Usuário" : "User"}</TableHead>
                      <TableHead>{isPt ? "Perfil" : "Role"}</TableHead>
                      <TableHead className="text-right">{isPt ? "Ações" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </TableCell>
                        <TableCell>{roleLabels[user.role]?.[isPt ? "pt" : "en"] ?? user.role}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => approveUser.mutate(user.id)} disabled={approveUser.isPending || rejectUser.isPending}>
                              <CheckCircle size={14} />
                              {isPt ? "Aprovar" : "Approve"}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectUser.mutate(user.id)} disabled={approveUser.isPending || rejectUser.isPending}>
                              <XCircle size={14} />
                              {isPt ? "Recusar" : "Reject"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>

            <section className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Server size={18} className="text-primary" />
                <h2 className="font-display text-lg font-semibold">{isPt ? "Pré-reservas de cluster" : "Cluster pre-reservations"}</h2>
              </div>
              {pendingClusters.length === 0 ? (
                <div className="p-4"><EmptyState text={isPt ? "Nenhuma pré-reserva pendente." : "No pending pre-reservations."} /></div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingClusters.map((req) => (
                    <div key={req.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{req.cluster_name}</p>
                          <StatusBadge status={req.status} isPt={isPt} />
                        </div>
                        <p className="text-sm text-muted-foreground">{req.user_name} · {req.user_email}</p>
                        <p className="text-sm text-muted-foreground">
                          {req.start_date} - {req.end_date}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isPt ? "Pré-reserva expira em" : "Pre-reservation expires at"} {formatDateTime(req.pre_reservation_expires_at)}
                        </p>
                        {req.observation ? <p className="mt-2 text-sm text-muted-foreground">{req.observation}</p> : null}
                      </div>
                      <div className="flex gap-2 lg:justify-end">
                        <Button size="sm" onClick={() => approveCluster.mutate(req.id)} disabled={approveCluster.isPending || rejectCluster.isPending}>
                          <KeyRound size={14} />
                          {isPt ? "Aprovar e gerar chave" : "Approve and key"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectCluster.mutate(req.id)} disabled={approveCluster.isPending || rejectCluster.isPending}>
                          <XCircle size={14} />
                          {isPt ? "Recusar" : "Reject"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Shield size={18} className="text-primary" />
                <h2 className="font-display text-lg font-semibold">LGPD</h2>
              </div>
              {lgpdRequests.length === 0 ? (
                <div className="p-4"><EmptyState text={isPt ? "Nenhuma solicitação LGPD pendente." : "No pending LGPD requests."} /></div>
              ) : (
                <div className="divide-y divide-border">
                  {lgpdRequests.map((req) => (
                    <div key={req.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div>
                        <p className="font-medium text-foreground">{req.user_name}</p>
                        <p className="text-sm text-muted-foreground">{req.user_email}</p>
                        <p className="text-xs text-muted-foreground">
                          {req.request_type} · {formatDateTime(req.created_at)}
                        </p>
                        {req.reason ? <p className="mt-2 text-sm text-muted-foreground">{req.reason}</p> : null}
                      </div>
                      <div className="flex gap-2 lg:justify-end">
                        <Button size="sm" onClick={() => completeLgpd.mutate(req.id)} disabled={completeLgpd.isPending || rejectLgpd.isPending}>
                          <CheckCircle size={14} />
                          {isPt ? "Concluir" : "Complete"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectLgpd.mutate(req.id)} disabled={completeLgpd.isPending || rejectLgpd.isPending}>
                          <XCircle size={14} />
                          {isPt ? "Recusar" : "Reject"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="access" className="mt-6">
            <section className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <KeyRound size={18} className="text-primary" />
                <h2 className="font-display text-lg font-semibold">{isPt ? "Chaves e períodos de cluster" : "Cluster keys and periods"}</h2>
              </div>
              {clusterRequests.length === 0 ? (
                <div className="p-4"><EmptyState text={isPt ? "Nenhuma solicitação registrada." : "No cluster requests yet."} /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isPt ? "Cluster" : "Cluster"}</TableHead>
                      <TableHead>{isPt ? "Usuário" : "User"}</TableHead>
                      <TableHead>{isPt ? "Período" : "Period"}</TableHead>
                      <TableHead>{isPt ? "Chave" : "Key"}</TableHead>
                      <TableHead>{isPt ? "Status" : "Status"}</TableHead>
                      <TableHead className="text-right">{isPt ? "Ações" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clusterRequests.map((req) => {
                      const state = requestAccessState(req);
                      return (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.cluster_name}</TableCell>
                          <TableCell>
                            <p>{req.user_name}</p>
                            <p className="text-xs text-muted-foreground">{req.user_email}</p>
                          </TableCell>
                          <TableCell>{req.access_starts_at || req.start_date} - {req.access_ends_at || req.end_date}</TableCell>
                          <TableCell className="font-mono text-xs">{req.access_key || "-"}</TableCell>
                          <TableCell><StatusBadge status={state} isPt={isPt} /></TableCell>
                          <TableCell className="text-right">
                            {req.status === "approved" ? (
                              <Button size="sm" variant="outline" onClick={() => revokeCluster.mutate(req.id)} disabled={revokeCluster.isPending}>
                                <Ban size={14} />
                                {isPt ? "Revogar" : "Revoke"}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </section>
          </TabsContent>

          <TabsContent value="calendars" className="mt-6 grid gap-6 xl:grid-cols-2">
            <RoomManagement
              rooms={rooms}
              newRoomName={newRoomName}
              setNewRoomName={setNewRoomName}
              onCreate={handleCreateRoom}
              onDelete={handleDeleteRoom}
              creating={createRoom.isPending}
              deleting={deleteRoom.isPending}
              isPt={isPt}
            />
            <CalendarList
              title={isPt ? "Reservas do laboratório" : "Lab reservations"}
              icon={<CalendarDays size={18} />}
              items={labCalendarItems}
              isPt={isPt}
            />
            <CalendarList
              title={isPt ? "Uso dos clusters" : "Cluster usage"}
              icon={<Server size={18} />}
              items={clusterCalendarItems}
              isPt={isPt}
            />
            <p className="text-xs text-muted-foreground xl:col-span-2">
              {format(rangeStart, "dd MMM", { locale })} - {format(addDays(rangeEnd, -1), "dd MMM yyyy", { locale })}
            </p>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <section className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  <h2 className="font-display text-lg font-semibold">{isPt ? "Usuários" : "Users"}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => navigate("/admin/edit/docente")}>
                    <UserPlus size={14} />
                    {isPt ? "Novo docente" : "New faculty"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/admin/edit/student")}>
                    <UserPlus size={14} />
                    {isPt ? "Novo aluno" : "New student"}
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isPt ? "Nome" : "Name"}</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>{isPt ? "Perfil" : "Role"}</TableHead>
                    <TableHead>{isPt ? "Status" : "Status"}</TableHead>
                    <TableHead className="text-right">{isPt ? "Ações" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{roleLabels[user.role]?.[isPt ? "pt" : "en"] ?? user.role}</TableCell>
                      <TableCell><StatusBadge status={user.status ?? "active"} isPt={isPt} /></TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link to={editUserPath(user)}>
                            <Edit3 size={14} />
                            {isPt ? "Editar" : "Edit"}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </TabsContent>

          <TabsContent value="content" className="mt-6 grid gap-6 lg:grid-cols-2">
            <ResourceSection
              title={isPt ? "Blog" : "Blog"}
              addLabel={isPt ? "Novo post" : "New post"}
              addTo="/admin/edit/blog"
              editLabel={isPt ? "Editar" : "Edit"}
              rows={blog.map((post) => ({
                id: post.id,
                title: isPt ? post.titlePt : post.title,
                detail: post.date,
                editTo: `/admin/edit/blog/${post.id}`,
              }))}
            />
            <ResourceSection
              title={isPt ? "Projetos" : "Projects"}
              addLabel={isPt ? "Novo projeto" : "New project"}
              addTo="/admin/edit/project"
              editLabel={isPt ? "Editar" : "Edit"}
              rows={projects.map((project) => ({
                id: project.id,
                title: isPt ? project.titlePt : project.title,
                detail: project.status,
                editTo: `/admin/edit/project/${project.id}`,
              }))}
            />
            <ResourceSection
              title={isPt ? "Publicações" : "Publications"}
              addLabel={isPt ? "Nova publicação" : "New publication"}
              addTo="/admin/edit/publication"
              editLabel={isPt ? "Editar" : "Edit"}
              rows={publications.map((publication) => ({
                id: publication.id,
                title: isPt ? publication.titlePt : publication.title,
                detail: `${publication.venue} · ${publication.year}`,
                editTo: `/admin/edit/publication/${publication.id}`,
              }))}
            />
            <ResourceSection
              title={isPt ? "Docentes" : "Faculty"}
              addLabel={isPt ? "Novo docente" : "New faculty"}
              addTo="/admin/edit/docente"
              editLabel={isPt ? "Editar" : "Edit"}
              rows={docentes.map((docente) => ({
                id: docente.id,
                title: docente.name,
                detail: isPt ? docente.titlePt ?? "" : docente.title ?? "",
                editTo: `/admin/edit/docente/${docente.id}`,
              }))}
            />
            <ResourceSection
              title={isPt ? "Alunos" : "Students"}
              addLabel={isPt ? "Novo aluno" : "New student"}
              addTo="/admin/edit/student"
              editLabel={isPt ? "Editar" : "Edit"}
              rows={students.map((student) => ({
                id: student.id,
                title: student.name,
                detail: isPt ? student.levelPt ?? "" : student.level ?? "",
                editTo: `/admin/edit/student/${student.id}`,
              }))}
            />
            <ResourceSection
              title={isPt ? "Documentos" : "Docs"}
              addLabel={isPt ? "Novo documento" : "New doc"}
              addTo="/admin/edit/doc"
              editLabel={isPt ? "Editar" : "Edit"}
              rows={docs.map((doc) => ({
                id: doc.id,
                title: isPt ? doc.titlePt : doc.title,
                detail: doc.category,
                editTo: `/admin/edit/doc/${doc.id}`,
              }))}
            />
            <ResourceSection
              title={isPt ? "Clusters" : "Clusters"}
              addLabel={isPt ? "Novo cluster" : "New cluster"}
              addTo="/admin/edit/cluster"
              editLabel={isPt ? "Editar" : "Edit"}
              rows={(infra?.clusters ?? []).map((cluster) => ({
                id: cluster.id,
                title: cluster.name,
                detail: cluster.status,
                editTo: `/admin/edit/cluster/${cluster.id}`,
              }))}
            />
            <section className="rounded-lg border border-border bg-card p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatTile icon={<Newspaper size={18} />} label={isPt ? "Posts" : "Posts"} value={blog.length} />
                <StatTile icon={<FileText size={18} />} label={isPt ? "Docs" : "Docs"} value={docs.length} />
                <StatTile icon={<Database size={18} />} label={isPt ? "Clusters" : "Clusters"} value={infra?.clusters.length ?? 0} />
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
