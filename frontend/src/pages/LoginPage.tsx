import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import AuthPageShell from "@/components/AuthPageShell";

const LoginPage = () => {
  const { user, login } = useAuth();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setErrorMsg("");
    setLoading(true);

    try {
      const ok = await login(identifier, password);
      if (!ok) {
        setError(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("pending")) {
        setErrorMsg(t("auth.pendingAccount"));
      } else if (msg.includes("rejected")) {
        setErrorMsg(t("auth.rejectedAccount"));
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <AuthPageShell mode="login">
      <div className="mx-auto max-w-md py-2 lg:py-10">
        <div className="mb-9 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><LockKeyhole size={19} /></span>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">LaSDPC / {lang === "pt-BR" ? "Acesso" : "Access"}</span>
        </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("auth.loginTitle")}
            </h2>
            <p className="mb-9 mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("auth.loginSubtitle")}
            </p>

            {(error || errorMsg) && (
              <div role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMsg || t("auth.loginError")}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="identifier">{t("auth.identifierLabel")}</Label>
                <div className="relative"><Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={lang === "pt-BR" ? "email@usp.br ou número USP" : "email@usp.br or USP number"}
                  required
                  autoComplete="username"
                  className="h-12 rounded-xl bg-background/70 pl-11"
                /></div>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative"><LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-xl bg-background/70 pl-11"
                /></div>
              </div>
              <Button type="submit" className="mt-2 h-12 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/15" disabled={loading}>
                {loading ? "..." : t("auth.loginButton")} {!loading && <ArrowRight size={17} className="ml-2" />}
              </Button>
            </form>

            <p className="mt-8 border-t border-border/70 pt-6 text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                {t("auth.register")}
              </Link>
            </p>
      </div>
    </AuthPageShell>
  );
};

export default LoginPage;
