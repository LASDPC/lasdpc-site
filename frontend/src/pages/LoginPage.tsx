import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Server, Brain, Cloud, Shield } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/lasdpc-logo.png";

const LoginPage = () => {
  const { user, login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    const ok = await login(email, password);
    setLoading(false);
    if (!ok) {
      setError(true);
    }
  };

  const features = [
    { icon: <Server size={20} />, text: "High-Performance Computing" },
    { icon: <Brain size={20} />, text: "Artificial Intelligence" },
    { icon: <Cloud size={20} />, text: "Cloud Computing" },
    { icon: <Shield size={20} />, text: "Distributed Systems" },
  ];

  if (user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left panel - desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-4 mb-12">
            <img src={logo} alt="LASDPC" className="h-14 w-14 brightness-0 invert" />
            <div>
              <h1 className="font-display font-bold text-2xl">LASDPC</h1>
              <p className="text-sm text-primary-foreground/80">ICMC - USP</p>
            </div>
          </div>

          <h2 className="font-display text-3xl font-bold mb-4">
            Laboratório de Sistemas Distribuídos e Programação Concorrente
          </h2>
          <p className="text-primary-foreground/80 mb-10 max-w-md">
            Pesquisa de ponta em computação de alto desempenho, inteligência artificial e sistemas distribuídos.
          </p>

          <ul className="space-y-4">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-primary-foreground/90">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-foreground/10">
                  {f.icon}
                </span>
                <span className="text-sm font-medium">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/50">
          ICMC-USP, Av. Trabalhador São-Carlense, 400 - São Carlos, SP
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="glass-surface rounded-2xl border border-border p-8 shadow-xl">
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <img src={logo} alt="LASDPC" className="h-10 w-10" />
              <span className="font-display font-bold text-lg text-foreground">LASDPC</span>
            </div>

            <h2 className="font-display font-bold text-2xl text-foreground mb-1">
              {t("auth.loginTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("auth.loginSubtitle")}
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3">
                {t("auth.loginError")}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "..." : t("auth.loginButton")}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground mt-6">
              {t("auth.noAccount")}{" "}
              <span className="text-foreground">{t("auth.contactAdmin")}</span>
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
    </div>
  );
};

export default LoginPage;
