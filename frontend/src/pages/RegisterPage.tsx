import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { authService } from "@/services/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/lasdpc-logo.png";

const RegisterPage = () => {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("aluno_ativo");
  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.register({ name, email, password, role, observation });
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("already registered")) {
        setError(t("auth.emailExists"));
      } else {
        setError(t("auth.registerError"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="glass-surface rounded-2xl border border-border p-8 shadow-xl">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h2 className="font-display font-bold text-xl text-foreground mb-2">
              {t("auth.registerSuccess")}
            </h2>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6 justify-center"
          >
            <ArrowLeft size={16} />
            {t("auth.loginHere")}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-surface rounded-2xl border border-border p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <img src={logo} alt="LASDPC" className="h-10 w-10" />
            <span className="font-display font-bold text-lg text-foreground">LASDPC</span>
          </div>

          <h2 className="font-display font-bold text-2xl text-foreground mb-1">
            {t("auth.registerTitle")}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t("auth.registerSubtitle")}
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@usp.br"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t("auth.role")}</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
              >
                <option value="aluno_ativo">{t("auth.role.aluno")}</option>
                <option value="docente">{t("auth.role.docente")}</option>
                <option value="alumni">{t("auth.role.alumni")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observation">{t("auth.observation")}</Label>
              <textarea
                id="observation"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder={t("auth.observationPlaceholder")}
                className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : t("auth.registerButton")}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-6">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link to="/login" className="text-primary hover:underline">
              {t("auth.loginHere")}
            </Link>
          </p>
        </div>

        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6 justify-center"
        >
          <ArrowLeft size={16} />
          {t("auth.backToHome")}
        </Link>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
