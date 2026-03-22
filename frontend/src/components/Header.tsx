import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LanguageContext";
import { Sun, Moon, Contrast, Search, Menu, X, Globe, AArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/lasdpc-logo.png";

const navKeys = [
  { key: "nav.home", path: "/" },
  { key: "nav.people", path: "/people" },
  { key: "nav.research", path: "/research" },
  { key: "nav.infrastructure", path: "/infrastructure" },
  { key: "nav.blog", path: "/blog" },
  { key: "nav.contact", path: "/contact" },
  { key: "nav.docs", path: "/docs" },
];

const Header = () => {
  const { theme, setTheme, fontSize, setFontSize, toggleHighContrast } = useTheme();
  const { lang, setLang, t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  const themeIcon = theme === "dark" ? <Moon size={18} /> : <Sun size={18} />;
  const toggleLightDark = () => {
    setTheme(theme === "dark" || theme === "high-contrast" ? "light" : "dark");
  };

  return (
    <>
      {/* Blur overlay when mobile menu is open */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <header className="fixed top-0 left-0 right-0 z-50 glass-surface border-b border-border">
        <div className="container mx-auto grid grid-cols-3 items-center h-16 px-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img src={logo} alt="LASDPC Logo" className="h-9 w-9" />
            <span className="font-display font-bold text-lg text-foreground hidden sm:block">LASDPC</span>
          </Link>

          <nav className="hidden lg:flex items-center justify-center gap-1">
            {navKeys.map(({ key, path }) => (
              <Link
                key={key}
                to={path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 active:scale-95 ${
                  location.pathname === path
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 justify-end">
            <AnimatePresence>
              {searchOpen && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 160, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  autoFocus
                  placeholder={t("search.placeholder")}
                  className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  onBlur={() => setSearchOpen(false)}
                />
              )}
            </AnimatePresence>
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-md hover:bg-secondary text-foreground transition-all duration-200 active:scale-90" aria-label="Search">
              <Search size={18} />
            </button>

            <button onClick={() => setLang(lang === "pt-BR" ? "en-US" : "pt-BR")} className="p-2 rounded-md hover:bg-secondary text-foreground flex items-center gap-1 text-xs font-medium transition-all duration-200 active:scale-90" aria-label="Language">
              <Globe size={16} />
              <span className="hidden sm:inline">{lang === "pt-BR" ? "PT" : "EN"}</span>
            </button>

            <button onClick={toggleLightDark} className="p-2 rounded-md hover:bg-secondary text-foreground transition-all duration-200 active:scale-90" aria-label="Theme">
              {themeIcon}
            </button>

            <button
              onClick={toggleHighContrast}
              className={`p-2 rounded-md hover:bg-secondary text-foreground transition-all duration-200 active:scale-90 ${theme === "high-contrast" ? "ring-2 ring-primary" : ""}`}
              aria-label="High contrast"
              title={lang === "pt-BR" ? "Acessibilidade: Alto contraste" : "Accessibility: High contrast"}
            >
              <Contrast size={18} />
            </button>

            <button
              onClick={() => {
                const order = ["normal", "large", "x-large"] as const;
                const next = order[(order.indexOf(fontSize) + 1) % order.length];
                setFontSize(next);
              }}
              className={`p-2 rounded-md hover:bg-secondary text-foreground transition-all duration-200 active:scale-90 ${fontSize !== "normal" ? "ring-2 ring-primary" : ""}`}
              aria-label="Font size"
              title={lang === "pt-BR" ? `Tamanho da fonte: ${fontSize === "normal" ? "Normal" : fontSize === "large" ? "Grande" : "Extra grande"}` : `Font size: ${fontSize === "normal" ? "Normal" : fontSize === "large" ? "Large" : "Extra large"}`}
            >
              <AArrowUp size={18} />
              <span className="sr-only text-[10px]">
                {fontSize === "normal" ? "A" : fontSize === "large" ? "A+" : "A++"}
              </span>
            </button>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-md hover:bg-secondary text-foreground transition-all duration-200 active:scale-90" aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden border-t border-border bg-card px-4 overflow-hidden"
            >
              <div className="pb-4 pt-2">
                {navKeys.map(({ key, path }, i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <Link
                      to={path}
                      onClick={() => setMobileOpen(false)}
                      className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                        location.pathname === path
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {t(key)}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Header;