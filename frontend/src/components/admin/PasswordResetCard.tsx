import { useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/services/auth";
import { usersService } from "@/services/users";

export default function PasswordResetCard({ user, isPt }: { user: User; isPt: boolean }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const bytes = new TextEncoder().encode(password).length;
    if (password.length < 12 || bytes > 72) {
      setError(isPt ? "Use uma senha entre 12 e 72 bytes." : "Use a password between 12 and 72 bytes.");
      return;
    }
    if (password !== confirmation) {
      setError(isPt ? "As senhas não coincidem." : "Passwords do not match.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await usersService.setPassword(user.id, password);
      setPassword("");
      setConfirmation("");
      setVisible(false);
      toast.success(isPt ? "Senha alterada. As sessões antigas foram encerradas." : "Password changed. Previous sessions were signed out.");
    } catch (err) {
      setError(err instanceof Error ? err.message : (isPt ? "Não foi possível alterar a senha." : "Could not change the password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="account-access" className="surface-panel scroll-mt-28 rounded-2xl p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-3 border-b border-border/70 pb-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><KeyRound size={19} /></span>
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">06</p>
          <h2 className="mt-0.5 font-display text-xl font-semibold text-foreground">{isPt ? "Acesso à conta" : "Account access"}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{isPt ? `Defina uma nova senha para ${user.name}. Esta ação é separada das alterações do perfil.` : `Set a new password for ${user.name}. This action is separate from profile changes.`}</p>
        </div>
      </div>
      {user.is_bootstrap_admin ? (
        <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
          {isPt ? "A senha do administrador principal é gerenciada por ADMIN_PASSWORD na configuração do servidor." : "The primary administrator password is managed by ADMIN_PASSWORD in the server configuration."}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`new-password-${user.id}`}>{isPt ? "Nova senha" : "New password"}</Label>
              <div className="relative mt-1">
                <Input id={`new-password-${user.id}`} type={visible ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} className="pr-11" aria-invalid={!!error} />
                <button type="button" onClick={() => setVisible(!visible)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={visible ? (isPt ? "Ocultar senha" : "Hide password") : (isPt ? "Mostrar senha" : "Show password")}>
                  {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor={`confirm-password-${user.id}`}>{isPt ? "Confirmar senha" : "Confirm password"}</Label>
              <Input id={`confirm-password-${user.id}`} type={visible ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(""); }} className="mt-1" aria-invalid={!!error} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{isPt ? "Use pelo menos 12 caracteres e no máximo 72 bytes. As sessões já abertas serão encerradas." : "Use at least 12 characters and at most 72 bytes. Existing sessions will be signed out."}</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving || !password || !confirmation}>
              <ShieldCheck size={16} />{saving ? (isPt ? "Salvando..." : "Saving...") : (isPt ? "Alterar senha" : "Change password")}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
