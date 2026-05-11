import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useInfrastructure } from "@/hooks/useInfrastructure";
import { clusterRequestsService } from "@/services/clusterRequests";
import type { CustomFieldDef } from "@/services/clusterRequests";
import type { Cluster } from "@/services/infrastructure";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, Server, KeyRound, Ban } from "lucide-react";
import { mediaUrl } from "@/lib/media";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const UsageBar = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full hero-gradient-bg transition-all duration-700" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const InfrastructurePageSkeleton = () => (
  <div className="py-10">
    <div className="container mx-auto px-4">
      <Skeleton className="h-10 w-56 mb-4" /><Skeleton className="h-4 w-56 mb-12" />
      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <div className="space-y-3 pt-1">{Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-2 w-full rounded-full" />)}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ---------- Dynamic field renderer ---------- */
function DynamicField({
  field,
  value,
  onChange,
  isPt,
}: {
  field: CustomFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  isPt: boolean;
}) {
  const label = isPt ? field.labelPt : field.label;

  switch (field.type) {
    case "select":
      return (
        <div>
          <Label>{label}{field.required && " *"}</Label>
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
            required={field.required}
          >
            <option value="">—</option>
            {field.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      );
    case "number":
      return (
        <div>
          <Label>{label}{field.required && " *"}</Label>
          <Input
            type="number"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded border-border"
          />
          {label}
        </label>
      );
    case "date":
      return (
        <div>
          <Label>{label}{field.required && " *"}</Label>
          <Input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      );
    default: // text
      return (
        <div>
          <Label>{label}{field.required && " *"}</Label>
          <Input
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      );
  }
}

/* ---------- Duration helper ---------- */
function formatDuration(start: string, end: string, t: (k: string) => string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return "";
  const totalHours = Math.round(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${t("infra.days")}`);
  if (hours > 0) parts.push(`${hours} ${t("infra.hours")}`);
  return parts.join(", ");
}

/* ---------- Status badge ---------- */
function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    pending: { cls: "bg-yellow-500/10 text-yellow-600", icon: <Clock size={12} /> },
    approved: { cls: "bg-green-500/10 text-green-600", icon: <CheckCircle size={12} /> },
    rejected: { cls: "bg-red-500/10 text-red-600", icon: <XCircle size={12} /> },
    expired: { cls: "bg-muted text-muted-foreground", icon: <Clock size={12} /> },
    revoked: { cls: "bg-destructive/10 text-destructive", icon: <Ban size={12} /> },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${s.cls}`}>
      {s.icon} {t(`infra.${status}`)}
    </span>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

/* ========== MAIN PAGE ========== */
const InfrastructurePage = () => {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const isPt = lang === "pt-BR";
  const { data: infra, isLoading } = useInfrastructure();
  const queryClient = useQueryClient();

  // Request form state
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [observation, setObservation] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});

  // My requests
  const { data: myRequests = [] } = useQuery({
    queryKey: ["cluster-requests", "mine"],
    queryFn: clusterRequestsService.mine,
    enabled: !!user,
  });

  const createReq = useMutation({
    mutationFn: clusterRequestsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cluster-requests"] });
      toast.success(t("infra.requestSent"));
      setSelectedClusterId("");
      setStartDate("");
      setEndDate("");
      setObservation("");
      setCustomValues({});
    },
  });

  if (!user) return <Navigate to="/login" state={{ from: "/infrastructure" }} replace />;
  if (isLoading || !infra) return <InfrastructurePageSkeleton />;

  const clusters = infra.clusters;
  const selectedCluster: Cluster | undefined = clusters.find((c) => c.id === selectedClusterId);
  const customFields: CustomFieldDef[] = selectedCluster?.custom_fields ?? [];
  const duration = startDate && endDate ? formatDuration(startDate, endDate, t) : "";
  const visibleRequests = myRequests.slice(0, 8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReq.mutate({
      cluster_id: selectedClusterId,
      start_date: startDate,
      end_date: endDate,
      observation,
      custom_field_values: customValues,
    });
  };

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">{t("infra.title")}</h1>

        {/* ---- Clusters display ---- */}
        <h2 className="font-display text-xl font-semibold text-foreground mb-6 mt-8">{t("infra.clusters")}</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {clusters.map((c, i) => (
            <div key={c.id} className="relative group">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="bg-card rounded-xl p-6 border border-border">
                {c.image && (
                  <img
                    src={mediaUrl(c.image)}
                    alt={c.name}
                    className="w-full h-32 object-cover rounded-md mb-4 border border-border"
                  />
                )}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold text-foreground">{c.name}</h3>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${c.status === "online" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>
                    {c.status === "online" ? t("infra.online") : t("infra.maintenance")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-5">{isPt ? c.descriptionPt : c.description}</p>
                <div className="space-y-3">
                  <UsageBar label={t("infra.cpu")} value={c.cpuUsage} />
                  <UsageBar label={t("infra.gpu")} value={c.gpuUsage} />
                  <UsageBar label={t("infra.memory")} value={c.memoryUsage} />
                  <UsageBar label={t("infra.storage")} value={c.storageUsage} />
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* ---- Request Form ---- */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Server size={20} /> {t("infra.requestTitle")}
            </h2>
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div>
                <Label>{t("infra.selectCluster")}</Label>
                <select
                  value={selectedClusterId}
                  onChange={(e) => { setSelectedClusterId(e.target.value); setCustomValues({}); }}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                  required
                >
                  <option value="">—</option>
                  {clusters.filter((c) => c.status === "online").map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("infra.startDate")}</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div>
                  <Label>{t("infra.endDate")}</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={startDate || undefined} />
                </div>
              </div>
              {duration && (
                <p className="text-xs text-muted-foreground">
                  {t("infra.duration")}: <span className="font-medium text-foreground">{duration}</span>
                </p>
              )}

              {/* Dynamic custom fields for the selected cluster */}
              {customFields.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border">
                  {customFields.map((field) => (
                    <DynamicField
                      key={field.name}
                      field={field}
                      value={customValues[field.name]}
                      onChange={(v) => setCustomValues((prev) => ({ ...prev, [field.name]: v }))}
                      isPt={isPt}
                    />
                  ))}
                </div>
              )}

              <div>
                <Label>{t("infra.observation")}</Label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder={t("infra.observationPlaceholder")}
                  className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                />
              </div>

              <Button type="submit" className="w-full" disabled={createReq.isPending}>
                {createReq.isPending ? "..." : t("infra.submit")}
              </Button>
            </form>
          </div>

          {/* ---- My Pending Requests ---- */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Clock size={20} /> {t("infra.myRequests")}
            </h2>
            {visibleRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("infra.noRequests")}</p>
            ) : (
              <div className="space-y-3">
                {visibleRequests.map((req) => (
                  <div key={req.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{req.cluster_name}</span>
                      <StatusBadge status={req.status} t={t} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {req.start_date} → {req.end_date}
                      {" · "}
                      {formatDuration(req.start_date, req.end_date, t)}
                    </p>
                    {req.observation && (
                      <p className="text-xs text-muted-foreground italic">"{req.observation}"</p>
                    )}
                    {req.status === "pending" && req.pre_reservation_expires_at && (
                      <p className="text-xs text-muted-foreground">
                        {isPt ? "Pré-reserva válida até" : "Pre-reservation valid until"}{" "}
                        <span className="font-medium text-foreground">{formatDateTime(req.pre_reservation_expires_at)}</span>
                      </p>
                    )}
                    {req.status === "approved" && req.access_key && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <KeyRound size={14} />
                          {isPt ? "Chave de acesso" : "Access key"}
                        </div>
                        <p className="mt-1 font-mono text-sm text-primary">{req.access_key}</p>
                        <p className="mt-1 text-muted-foreground">
                          {isPt ? "Período" : "Period"}: {req.access_starts_at || req.start_date} → {req.access_ends_at || req.end_date}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfrastructurePage;
