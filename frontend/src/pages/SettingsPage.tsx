import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, ExternalLink, Shield, Trash2, User, Mail, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const SettingsPage = () => {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [showDeletion, setShowDeletion] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [requestingDeletion, setRequestingDeletion] = useState(false);

  if (!user) {
    return (
      <div className="py-12">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("menu.settings")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPt ? "Entre para acessar suas configuracoes." : "Sign in to access your settings."}
          </p>
          <Button className="mt-5" onClick={() => navigate("/login")}>
            {isPt ? "Entrar" : "Sign in"}
          </Button>
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await authService.requestLgpdExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lasdpc-profile-${user.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(isPt ? "Dados exportados." : "Data exported.");
    } catch {
      toast.error(isPt ? "Erro ao exportar dados" : "Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleRequestDeletion = async () => {
    setRequestingDeletion(true);
    try {
      await authService.requestLgpdDeletion(deletionReason || undefined);
      toast.success(isPt ? "Solicitacao de exclusao enviada." : "Deletion request submitted.");
      setShowDeletion(false);
      setDeletionReason("");
    } catch {
      toast.error(isPt ? "Erro ao solicitar exclusao" : "Failed to submit deletion request");
    } finally {
      setRequestingDeletion(false);
    }
  };

  return (
    <div className="py-10">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("menu.settings")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPt ? "Gerencie dados da conta, privacidade e preferencias do seu perfil." : "Manage account data, privacy, and profile preferences."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-2">
            <a href="#account" className="flex min-h-10 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium text-foreground">
              <User size={16} />
              {isPt ? "Conta" : "Account"}
            </a>
            <a href="#privacy" className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Shield size={16} />
              {profileLabel(isPt)}
            </a>
          </aside>

          <main className="space-y-6">
            <section id="account" className="rounded-lg border border-border bg-card p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-foreground">{isPt ? "Conta" : "Account"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isPt ? "Informacoes basicas usadas para identificar voce no laboratorio." : "Basic information used to identify you in the lab."}
                  </p>
                </div>
                {user.is_admin && <Badge>Admin</Badge>}
              </div>

              <div className="space-y-3">
                <div className="flex min-h-11 items-center gap-3 rounded-lg bg-secondary/60 px-3">
                  <User size={16} className="text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="flex min-h-11 items-center gap-3 rounded-lg bg-secondary/60 px-3">
                  <Mail size={16} className="text-muted-foreground" />
                  <span className="min-w-0 truncate text-sm text-foreground">{user.email}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => navigate(`/profile/${user.id}`)}>
                  <User size={15} className="mr-2" />
                  {isPt ? "Editar perfil publico" : "Edit public profile"}
                </Button>
              </div>
            </section>

            <section id="privacy" className="rounded-lg border border-border bg-card p-5">
              <div className="mb-5 flex items-start gap-3">
                <Shield size={20} className="mt-0.5 text-primary" />
                <div>
                  <h2 className="font-semibold text-foreground">{profileLabel(isPt)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isPt
                      ? "Acoes sensiveis ficam aqui para nao poluir o perfil publico."
                      : "Sensitive actions live here instead of the public profile."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{t("profile.exportData")}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isPt ? "Baixe uma copia JSON dos dados associados a sua conta." : "Download a JSON copy of the data associated with your account."}
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleExport} disabled={exporting}>
                    <Download size={15} className="mr-2" />
                    {exporting ? (isPt ? "Exportando..." : "Exporting...") : t("profile.exportData")}
                  </Button>
                </div>

                <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="mt-0.5 text-destructive" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground">{t("profile.requestDeletion")}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {isPt
                          ? "Sua conta sera anonimizada somente apos aprovacao administrativa."
                          : "Your account will be anonymized only after administrative approval."}
                      </p>
                    </div>
                    {!showDeletion && (
                      <Button variant="destructive" size="sm" onClick={() => setShowDeletion(true)}>
                        <Trash2 size={14} className="mr-2" />
                        {isPt ? "Iniciar" : "Start"}
                      </Button>
                    )}
                  </div>

                  {showDeletion && (
                    <div className="mt-4 space-y-3">
                      <Textarea
                        value={deletionReason}
                        onChange={(event) => setDeletionReason(event.target.value)}
                        placeholder={isPt ? "Motivo (opcional)" : "Reason (optional)"}
                        className="min-h-[86px] resize-none bg-background"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button variant="destructive" size="sm" onClick={handleRequestDeletion} disabled={requestingDeletion}>
                          {requestingDeletion ? (isPt ? "Enviando..." : "Submitting...") : t("profile.requestDeletion")}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowDeletion(false)} disabled={requestingDeletion}>
                          {t("profile.cancel")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/privacy-policy" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  {t("privacy.title")}
                  <ExternalLink size={14} />
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

const profileLabel = (isPt: boolean) => (isPt ? "Privacidade e LGPD" : "Privacy and LGPD");

export default SettingsPage;
