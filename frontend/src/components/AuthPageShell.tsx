import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Network, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";

type AuthPageShellProps = {
  mode: "login" | "register";
  children: ReactNode;
};

const content = {
  login: {
    pt: {
      eyebrow: "Área da comunidade · LaSDPC",
      lead: "Sua pesquisa",
      accent: "continua aqui.",
      description: "Entre para acompanhar a vida do laboratório e acessar os espaços da nossa comunidade.",
      detail: "Um espaço para quem pesquisa, ensina e constrói novas conexões.",
      link: "Conheça o laboratório",
    },
    en: {
      eyebrow: "Community area · LaSDPC",
      lead: "Your research",
      accent: "continues here.",
      description: "Sign in to stay connected to the lab and access our community spaces.",
      detail: "A space for people who research, teach, and build new connections.",
      link: "Explore the lab",
    },
  },
  register: {
    pt: {
      eyebrow: "Faça parte · LaSDPC",
      lead: "Toda descoberta",
      accent: "começa com pessoas.",
      description: "Crie seu perfil para se conectar ao laboratório e participar da nossa comunidade de pesquisa.",
      detail: "Seu cadastro será analisado pela equipe antes da liberação do acesso.",
      link: "Conheça nossa equipe",
    },
    en: {
      eyebrow: "Join us · LaSDPC",
      lead: "Every discovery",
      accent: "starts with people.",
      description: "Create your profile to connect with the lab and join our research community.",
      detail: "Our team will review your registration before granting access.",
      link: "Meet our team",
    },
  },
};

export default function AuthPageShell({ mode, children }: AuthPageShellProps) {
  const { lang, t } = useLang();
  const reducedMotion = useReducedMotion();
  const copy = content[mode][lang === "pt-BR" ? "pt" : "en"];

  return (
    <section className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 tech-grid opacity-70" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-44 top-16 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-[100px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-[110px]" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-[1360px] items-start gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1fr)] lg:gap-16 lg:px-12 lg:py-20 xl:gap-24">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative lg:sticky lg:top-32 lg:pt-10"
        >
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:rounded-sm lg:mb-20">
            <ArrowLeft size={16} /> {t("auth.backToHome")}
          </Link>
          <p className="mb-5 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-primary">{copy.eyebrow}</p>
          <h1 className="max-w-[700px] font-display text-[clamp(3rem,5vw,5.5rem)] font-bold leading-[1.02] tracking-[-0.065em] text-foreground">
            {copy.lead}<br /><span className="text-primary">{copy.accent}</span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">{copy.description}</p>

          <div className="relative mt-12 hidden max-w-md overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/75 p-7 shadow-[0_24px_70px_-48px_hsl(var(--primary)/.55)] backdrop-blur-xl lg:block">
            <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full border border-primary/15" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full border border-primary/10" aria-hidden="true" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Network size={23} /></div>
            <p className="relative mt-6 max-w-xs font-display text-xl font-semibold leading-snug tracking-tight text-foreground">{copy.detail}</p>
            <Link to={mode === "login" ? "/historia" : "/people"} className="relative mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              {copy.link} <ArrowUpRight size={16} />
            </Link>
            <Sparkles className="absolute bottom-8 right-8 text-accent/50" size={26} aria-hidden="true" />
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="min-w-0 rounded-[1.75rem] border border-border/80 bg-card/90 p-6 shadow-[0_28px_80px_-44px_hsl(220_40%_2%/.32)] backdrop-blur-xl sm:p-9 lg:p-10 dark:bg-card/95"
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}
