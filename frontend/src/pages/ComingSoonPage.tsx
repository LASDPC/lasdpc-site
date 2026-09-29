import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LanguageContext";
import { Sun, Moon, Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/lasdpc-logo.png";

const ComingSoonPage = () => {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLang();

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const toggleLang = () => setLang(lang === "pt-BR" ? "en-US" : "pt-BR");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(ellipse_at_80%_15%,hsl(var(--primary)/0.14),transparent_55%)] text-foreground">
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-60" />
      {/* Top bar with toggles */}
      <div className="relative flex justify-end gap-2 p-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity text-sm font-medium"
          aria-label="Toggle language"
        >
          <Globe size={18} />
          {lang === "pt-BR" ? "EN" : "PT"}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="surface-panel relative max-w-xl rounded-3xl px-8 py-12 text-center shadow-2xl sm:px-14"
        >
          <motion.img
            src={logo}
            alt="LASDPC"
            className="h-24 w-24 mx-auto mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />

          <h2 className="font-display text-sm font-semibold text-muted-foreground tracking-wide uppercase mb-1">
            {t("comingsoon.labName")}
          </h2>
          <p className="text-xs text-muted-foreground mb-8">
            {t("comingsoon.institution")}
          </p>

          <motion.h1
            className="mb-4 font-display text-4xl font-bold tracking-[-0.06em] sm:text-6xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {t("comingsoon.title")}
          </motion.h1>

          <motion.p
            className="text-muted-foreground text-lg mb-12 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {t("comingsoon.subtitle")}
          </motion.p>
        </motion.div>
      </div>

      {/* Footer with admin link */}
      <motion.div
        className="relative pb-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <Lock size={12} />
          {t("comingsoon.adminLink")}
        </Link>
      </motion.div>
    </div>
  );
};

export default ComingSoonPage;
