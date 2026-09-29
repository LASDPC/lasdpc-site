import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Sun, Moon, Contrast, Menu, X, Languages, AArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/lasdpc-logo.png";
import UserAvatarButton from "@/components/UserAvatarButton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { mediaUrl } from "@/lib/media";

const publicNavKeys = [
  { key: "nav.home", path: "/" },
  { key: "nav.history", path: "/historia" },
  { key: "nav.people", path: "/people" },
  { key: "nav.research", path: "/research" },
  { key: "nav.blog", path: "/blog" },
  { key: "nav.contact", path: "/contact" },
];

const authNavKeys = [
  { key: "nav.reserva", path: "/reserva" },
  { key: "nav.docs", path: "/docs" },
];

const Header = () => {
  const { theme, setTheme, fontSize, setFontSize, toggleHighContrast } = useTheme();
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();
  const isPt = lang === "pt-BR";
  const navItems = [...publicNavKeys, ...(user ? authNavKeys : [])];

  useEffect(() => {
    const updateProgress = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(available > 0 ? (window.scrollY / available) * 100 : 0);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const themeIcon = theme === "dark" ? <Moon size={17} /> : <Sun size={17} />;
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const cycleFontSize = () => {
    const order = ["normal", "large", "x-large"] as const;
    setFontSize(order[(order.indexOf(fontSize) + 1) % order.length]);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center rounded-2xl border border-border/70 bg-background/90 px-3 shadow-[0_16px_42px_-26px_hsl(220_40%_2%/0.28)] backdrop-blur-2xl dark:bg-background/80 dark:shadow-[0_16px_42px_-26px_hsl(220_40%_2%/0.7)] sm:px-4">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5 rounded-xl pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-primary/10 ring-1 ring-primary/15">
              <img src={logo} alt="" className="h-8 w-8 object-contain transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
              <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
            </span>
            <span className="hidden leading-none sm:block">
              <span className="block font-display text-base font-bold tracking-[-0.03em] text-foreground">LaSDPC</span>
              <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.24em] text-muted-foreground">ICMC · USP</span>
            </span>
          </Link>

          <nav className="mx-auto hidden items-center rounded-xl bg-secondary/55 p-1 lg:flex" aria-label={isPt ? "Navegação principal" : "Main navigation"}>
            {navItems.map(({ key, path }) => (
              <Link
                key={key}
                to={path}
                aria-current={isActive(path) ? "page" : undefined}
                className={`relative rounded-lg px-3 py-2 text-[13px] font-medium transition-colors xl:px-3.5 ${
                  isActive(path) ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive(path) && (
                  <motion.div
                    layoutId="active-navigation"
                    className="absolute inset-0 rounded-lg bg-primary shadow-[0_8px_20px_-10px_hsl(var(--primary))]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10">{t(key)}</span>
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setLang(isPt ? "en-US" : "pt-BR")}
              className="control-button"
              aria-label={isPt ? "Mudar idioma para inglês" : "Change language to Portuguese"}
              title={isPt ? "English" : "Português"}
            >
              <Languages size={17} />
              <span className="hidden text-[10px] font-bold sm:inline">{isPt ? "PT" : "EN"}</span>
            </button>
            <button
              onClick={() => setTheme(theme === "dark" || theme === "high-contrast" ? "light" : "dark")}
              className="control-button"
              aria-label={isPt ? "Alternar tema" : "Toggle theme"}
            >
              {themeIcon}
            </button>
            <button
              onClick={toggleHighContrast}
              className={`control-button hidden sm:grid ${theme === "high-contrast" ? "bg-primary text-primary-foreground" : ""}`}
              aria-label={isPt ? "Alternar alto contraste" : "Toggle high contrast"}
              title={isPt ? "Alto contraste" : "High contrast"}
            >
              <Contrast size={17} />
            </button>
            <button
              onClick={cycleFontSize}
              className={`control-button hidden sm:grid ${fontSize !== "normal" ? "ring-1 ring-primary" : ""}`}
              aria-label={isPt ? "Aumentar tamanho da fonte" : "Increase font size"}
              title={isPt ? "Tamanho da fonte" : "Font size"}
            >
              <AArrowUp size={17} />
            </button>
            <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
            <UserAvatarButton />
            <button
              onClick={() => setMobileOpen((open) => !open)}
              className="control-button lg:hidden"
              aria-label={mobileOpen ? (isPt ? "Fechar menu" : "Close menu") : (isPt ? "Abrir menu" : "Open menu")}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        <div className="mx-auto mt-[-2px] h-[2px] max-w-[1440px] overflow-hidden rounded-full bg-transparent">
          <div className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-150" style={{ width: `${scrollProgress}%` }} />
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 cursor-default bg-background/60 backdrop-blur-md lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label={isPt ? "Fechar menu" : "Close menu"}
            />
            <motion.nav
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-x-3 top-[5.25rem] z-50 overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-3 shadow-2xl backdrop-blur-2xl lg:hidden"
              aria-label={isPt ? "Navegação móvel" : "Mobile navigation"}
            >
              {user && (
                <div className="mb-2 flex items-center gap-3 rounded-xl bg-secondary/70 p-3">
                  <Avatar className="h-9 w-9">
                    {(user.photo || user.avatar) && <AvatarImage src={mediaUrl(user.photo || user.avatar)} alt={user.name} />}
                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{user.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                {navItems.map(({ key, path }, index) => (
                  <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }}>
                    <Link
                      to={path}
                      aria-current={isActive(path) ? "page" : undefined}
                      className={`block rounded-xl px-3 py-3 text-sm font-medium ${isActive(path) ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground hover:bg-secondary"}`}
                    >
                      {t(key)}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-2 flex gap-2 border-t border-border/70 pt-3 sm:hidden">
                <button onClick={toggleHighContrast} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary p-3 text-xs font-semibold text-foreground">
                  <Contrast size={16} /> {isPt ? "Contraste" : "Contrast"}
                </button>
                <button onClick={cycleFontSize} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary p-3 text-xs font-semibold text-foreground">
                  <AArrowUp size={16} /> {isPt ? "Fonte" : "Font"}
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
