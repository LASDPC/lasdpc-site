import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { lang } = useLang();
  const isPt = lang === "pt-BR";

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
      <div className="surface-panel relative w-full max-w-2xl overflow-hidden rounded-3xl p-10 text-center md:p-16">
        <div className="tech-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">{isPt ? "Caminho indisponível" : "Unavailable path"}</p>
          <h1 className="mt-5 font-display text-[clamp(6rem,20vw,12rem)] font-bold leading-none text-primary/25">404</h1>
          <p className="mt-3 font-display text-2xl font-bold text-foreground">{isPt ? "Página não encontrada" : "Page not found"}</p>
          <p className="mx-auto mt-3 max-w-md break-all text-sm text-muted-foreground">{location.pathname}</p>
          <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-1">
            {isPt ? "Voltar ao início" : "Back to home"}<ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
