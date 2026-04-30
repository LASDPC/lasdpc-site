import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { authService } from "@/services/auth";
import { clusterRequestsService, type ClusterRequest } from "@/services/clusterRequests";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Users, Server, Shield } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, { en: string; pt: string }> = {
  docente: { en: "Faculty", pt: "Docente" },
  aluno_ativo: { en: "Active Student", pt: "Aluno Ativo" },
  alumni: { en: "Alumni", pt: "Egresso" },
};

/* ---- Duration helper ---- */
function formatDuration(start: string, end: string, isPt: boolean) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return "";
  const totalHours = Math.round(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${isPt ? "dias" : "days"}`);
  if (hours > 0) parts.push(`${hours}h`);
  return parts.join(", ");
}

/* ---- Tab button ---- */
function TabButton({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
      }`}
    >
      {icon} {label}
      {count > 0 && (
        <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

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

/* ========== MAIN PAGE ========== */
const PendingUsersPage = () => {
  const { isAdmin } = useAuth();
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"users" | "clusters" | "lgpd">("users");

  // Users
  const { data: pendingUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users", "pending"],
    queryFn: authService.listPending,
  });

  const approveUser = useMutation({
    mutationFn: (id: string) => authService.approveUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "pending"] });
      toast.success(isPt ? "Usuario aprovado!" : "User approved!");
    },
  });

  const rejectUser = useMutation({
    mutationFn: (id: string) => authService.rejectUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "pending"] });
      toast.success(isPt ? "Solicitacao recusada." : "Request rejected.");
    },
  });

  // Clusters
  const { data: pendingClusters = [], isLoading: loadingClusters } = useQuery({
    queryKey: ["cluster-requests", "pending"],
    queryFn: clusterRequestsService.pending,
  });

  const approveCluster = useMutation({
    mutationFn: (id: string) => clusterRequestsService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cluster-requests"] });
      toast.success(isPt ? "Solicitacao aprovada!" : "Request approved!");
    },
  });

  const rejectCluster = useMutation({
    mutationFn: (id: string) => clusterRequestsService.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cluster-requests"] });
      toast.success(isPt ? "Solicitacao recusada." : "Request rejected.");
    },
  });

  // LGPD
  const { data: lgpdRequests = [], isLoading: loadingLgpd } = useQuery<LgpdRequest[]>({
    queryKey: ["lgpd-requests"],
    queryFn: authService.listLgpdRequests as () => Promise<LgpdRequest[]>,
  });

  const completeLgpd = useMutation({
    mutationFn: (id: string) => authService.completeLgpdRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lgpd-requests"] });
      toast.success(isPt ? "Solicitacao LGPD concluida!" : "LGPD request completed!");
    },
  });

  const rejectLgpd = useMutation({
    mutationFn: (id: string) => authService.rejectLgpdRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lgpd-requests"] });
      toast.success(isPt ? "Solicitacao LGPD rejeitada." : "LGPD request rejected.");
    },
  });

  if (!isAdmin) return <Navigate to="/login" replace />;

  const isLoading = tab === "users" ? loadingUsers : tab === "clusters" ? loadingClusters : loadingLgpd;

  return (
    <div className="py-8">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Clock size={24} className="text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t("admin.pendingUsers")}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-3">
          <TabButton
            active={tab === "users"}
            onClick={() => setTab("users")}
            icon={<Users size={16} />}
            label={t("admin.tabUsers")}
            count={pendingUsers.length}
          />
          <TabButton
            active={tab === "clusters"}
            onClick={() => setTab("clusters")}
            icon={<Server size={16} />}
            label={t("admin.tabClusters")}
            count={pendingClusters.length}
          />
          <TabButton
            active={tab === "lgpd"}
            onClick={() => setTab("lgpd")}
            icon={<Shield size={16} />}
            label={t("admin.tabLgpd")}
            count={lgpdRequests.length}
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : tab === "users" ? (
          /* ---- Users Tab ---- */
          pendingUsers.length === 0 ? (
            <EmptyState text={t("admin.noPending")} />
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => {
                const roleLabel = ROLE_LABELS[user.role]?.[isPt ? "pt" : "en"] ?? user.role;
                const details = [
                  user.advisor_name && { label: isPt ? "Orientador" : "Advisor", value: user.advisor_name },
                  (user.levelPt || user.level) && { label: isPt ? "Categoria" : "Category", value: isPt ? user.levelPt || user.level : user.level || user.levelPt },
                  user.registration_objective && { label: isPt ? "Objetivo" : "Objective", value: user.registration_objective },
                  user.observation && { label: isPt ? "Observações" : "Observations", value: user.observation },
                ].filter(Boolean) as Array<{ label: string; value: string }>;
                return (
                  <div key={user.id} className="p-4 bg-card border border-border rounded-xl space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {user.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <span className="text-xs text-muted-foreground capitalize">{roleLabel}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" onClick={() => approveUser.mutate(user.id)} disabled={approveUser.isPending || rejectUser.isPending}>
                          <CheckCircle size={14} className="mr-1" /> {t("admin.approve")}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectUser.mutate(user.id)} disabled={approveUser.isPending || rejectUser.isPending}>
                          <XCircle size={14} className="mr-1" /> {t("admin.reject")}
                        </Button>
                      </div>
                    </div>
                    {details.length > 0 && (
                      <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-muted-foreground space-y-1">
                        {details.map((detail) => (
                          <p key={detail.label}>
                            <span className="font-medium text-foreground">{detail.label}:</span> {detail.value}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : tab === "clusters" ? (
          /* ---- Clusters Tab ---- */
          pendingClusters.length === 0 ? (
            <EmptyState text={t("admin.noPending")} />
          ) : (
            <div className="space-y-4">
              {pendingClusters.map((req) => (
                <ClusterRequestCard
                  key={req.id}
                  req={req}
                  isPt={isPt}
                  t={t}
                  onApprove={() => approveCluster.mutate(req.id)}
                  onReject={() => rejectCluster.mutate(req.id)}
                  loading={approveCluster.isPending || rejectCluster.isPending}
                />
              ))}
            </div>
          )
        ) : (
          /* ---- LGPD Tab ---- */
          lgpdRequests.length === 0 ? (
            <EmptyState text={t("admin.noPending")} />
          ) : (
            <div className="space-y-4">
              {lgpdRequests.map((req) => (
                <div key={req.id} className="p-4 bg-card border border-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          req.request_type === "deletion"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                        }`}>
                          {req.request_type === "deletion"
                            ? (isPt ? "Exclusao" : "Deletion")
                            : (isPt ? "Exportacao" : "Export")}
                        </span>
                      </div>
                      <p className="font-medium text-foreground mt-1">{req.user_name}</p>
                      <p className="text-xs text-muted-foreground">{req.user_email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" onClick={() => completeLgpd.mutate(req.id)} disabled={completeLgpd.isPending || rejectLgpd.isPending}>
                        <CheckCircle size={14} className="mr-1" /> {isPt ? "Concluir" : "Complete"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectLgpd.mutate(req.id)} disabled={completeLgpd.isPending || rejectLgpd.isPending}>
                        <XCircle size={14} className="mr-1" /> {t("admin.reject")}
                      </Button>
                    </div>
                  </div>
                  {req.reason && (
                    <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{isPt ? "Motivo:" : "Reason:"}</span> {req.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <CheckCircle size={48} className="mx-auto mb-4 opacity-40" />
      <p>{text}</p>
    </div>
  );
}

function ClusterRequestCard({ req, isPt, t, onApprove, onReject, loading }: {
  req: ClusterRequest; isPt: boolean; t: (k: string) => string;
  onApprove: () => void; onReject: () => void; loading: boolean;
}) {
  const duration = formatDuration(req.start_date, req.end_date, isPt);
  const fieldDefs = req.custom_field_defs ?? [];

  return (
    <div className="p-4 bg-card border border-border rounded-xl space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{req.cluster_name}</p>
          <p className="text-xs text-muted-foreground">
            {req.user_name} · {req.user_email}
          </p>
          <p className="text-xs text-muted-foreground">
            {req.start_date} → {req.end_date} · {duration}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={onApprove} disabled={loading}>
            <CheckCircle size={14} className="mr-1" /> {t("admin.approve")}
          </Button>
          <Button size="sm" variant="destructive" onClick={onReject} disabled={loading}>
            <XCircle size={14} className="mr-1" /> {t("admin.reject")}
          </Button>
        </div>
      </div>
      {req.observation && (
        <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{isPt ? "Observacao:" : "Note:"}</span> {req.observation}
        </div>
      )}
      {/* Show filled custom fields */}
      {fieldDefs.length > 0 && Object.keys(req.custom_field_values).length > 0 && (
        <div className="bg-muted/30 rounded-lg px-3 py-2 text-sm space-y-1">
          {fieldDefs.map((fd) => {
            const val = req.custom_field_values[fd.name];
            if (val === undefined || val === null || val === "") return null;
            const label = isPt ? fd.labelPt : fd.label;
            return (
              <div key={fd.name} className="flex gap-2">
                <span className="font-medium text-foreground">{label}:</span>
                <span className="text-muted-foreground">{String(val)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PendingUsersPage;
