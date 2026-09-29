import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  Cpu,
  GraduationCap,
  Network,
  Users,
} from "lucide-react";

import { useLang } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type Localized = { pt: string; en: string };
type HistoryEventKey = "1990" | "gsdpc" | "evolution" | "training" | "today";

const EVENT_KEYS: HistoryEventKey[] = ["1990", "gsdpc", "evolution", "training", "today"];
const pick = (value: Localized, isPt: boolean) => (isPt ? value.pt : value.en);

const eventMeta = {
  "1990": {
    icon: CalendarDays,
    era: { pt: "1990", en: "1990" },
    metric: "1990",
    metricLabel: { pt: "O começo", en: "The beginning" },
    photo: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1500&q=85",
    photoAlt: { pt: "Espaço de trabalho que ilustra o início do laboratório", en: "Workspace illustrating the lab's early years" },
    subjects: [
      { pt: "ICMC · USP", en: "ICMC · USP" },
      { pt: "Sistemas distribuídos", en: "Distributed systems" },
      { pt: "Programação concorrente", en: "Concurrent programming" },
    ],
  },
  gsdpc: {
    icon: Network,
    era: { pt: "As origens", en: "Early years" },
    metric: "GSDPC",
    metricLabel: { pt: "Grupo de pesquisa", en: "Research group" },
    photo: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1500&q=85",
    photoAlt: { pt: "Servidores que ilustram a pesquisa em sistemas distribuídos", en: "Servers illustrating distributed systems research" },
    subjects: [
      { pt: "Grupo de pesquisa", en: "Research group" },
      { pt: "Continuidade", en: "Continuity" },
      { pt: "Colaboração", en: "Collaboration" },
    ],
  },
  evolution: {
    icon: Cpu,
    era: { pt: "Década de 1990", en: "The 1990s" },
    metric: "90s",
    metricLabel: { pt: "Expansão técnica", en: "Technical growth" },
    photo: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1500&q=85",
    photoAlt: { pt: "Placa eletrônica que ilustra a evolução da computação", en: "Circuit board illustrating the evolution of computing" },
    subjects: [
      { pt: "Algoritmos paralelos", en: "Parallel algorithms" },
      { pt: "Redes", en: "Networks" },
      { pt: "Desempenho", en: "Performance" },
    ],
  },
  training: {
    icon: GraduationCap,
    era: { pt: "Ao longo do tempo", en: "Through the years" },
    metric: "130+",
    metricLabel: { pt: "Mestres e doutores", en: "MSc and PhD alumni" },
    photo: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1500&q=85",
    photoAlt: { pt: "Estudantes colaborando, como ilustração da formação de pesquisadores", en: "Students collaborating, illustrating researcher training" },
    subjects: [
      { pt: "Formação", en: "Mentorship" },
      { pt: "Egressos", en: "Alumni" },
      { pt: "Iniciação científica", en: "Undergraduate research" },
    ],
  },
  today: {
    icon: BrainCircuit,
    era: { pt: "Hoje", en: "Today" },
    metric: "→",
    metricLabel: { pt: "Em movimento", en: "Moving forward" },
    photo: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1500&q=85",
    photoAlt: { pt: "Equipe em atividade, ilustrando as pesquisas atuais", en: "Team at work, illustrating current research" },
    subjects: [
      { pt: "Nuvem", en: "Cloud" },
      { pt: "Computação verde", en: "Green computing" },
      { pt: "Educação aberta", en: "Open education" },
    ],
  },
} as const;

const copy = {
  pt: {
    eyebrow: "1990 — presente · ICMC/USP",
    headlineA: "O futuro tem",
    headlineB: "uma história.",
    heroDescription: "Uma trajetória construída por pessoas, perguntas e descobertas. Conheça os marcos que fizeram do LaSDPC um espaço de pesquisa em constante evolução.",
    explore: "Explorar a trajetória",
    meetPeople: "Conheça as pessoas",
    visualLabel: "O primeiro capítulo",
    illustrative: "Imagem ilustrativa",
    yearsLabel: "Desde",
    alumniLabel: "Mestres e doutores formados",
    chaptersLabel: "Capítulos para explorar",
    introEyebrow: "Nossa trajetória",
    introTitle: "Cada geração deixa uma nova conexão.",
    introBody: "A história do laboratório é feita de ideias que mudaram com a tecnologia e de uma comunidade que segue pesquisando, ensinando e colaborando.",
    navLabel: "Navegação pelos capítulos da história",
    chapterLabel: "Capítulo",
    more: "Ler o capítulo completo",
    less: "Recolher capítulo",
    threadsEyebrow: "Ideias que atravessam o tempo",
    threadsTitle: "As perguntas mudam. A curiosidade permanece.",
    threadsBody: "Da computação paralela às aplicações em nuvem, estas linhas mostram como a base do laboratório se desdobrou em novas pesquisas.",
    endingEyebrow: "A história continua",
    endingTitle: "O próximo capítulo está sendo escrito agora.",
    endingBody: "Conheça quem faz parte dessa trajetória e explore as pesquisas que estão moldando o que vem a seguir.",
    researchLink: "Explorar pesquisas",
    peopleLink: "Conhecer a equipe",
    threads: ["Computação paralela", "Sistemas distribuídos", "Escalonamento", "Computação em nuvem", "Redes de sensores", "Educação aberta"],
  },
  en: {
    eyebrow: "1990 — present · ICMC/USP",
    headlineA: "The future has",
    headlineB: "a history.",
    heroDescription: "A journey shaped by people, questions, and discoveries. Explore the milestones that made LaSDPC a place of research in constant evolution.",
    explore: "Explore the timeline",
    meetPeople: "Meet the people",
    visualLabel: "The first chapter",
    illustrative: "Illustrative image",
    yearsLabel: "Since",
    alumniLabel: "MSc and PhD alumni",
    chaptersLabel: "Chapters to explore",
    introEyebrow: "Our journey",
    introTitle: "Every generation creates a new connection.",
    introBody: "The lab's history is made of ideas that evolved with technology and a community that keeps researching, teaching, and collaborating.",
    navLabel: "Navigate history chapters",
    chapterLabel: "Chapter",
    more: "Read the full chapter",
    less: "Close chapter",
    threadsEyebrow: "Ideas through the years",
    threadsTitle: "The questions change. Curiosity remains.",
    threadsBody: "From parallel computing to cloud applications, these subjects show how the lab's foundations developed into new research.",
    endingEyebrow: "The story continues",
    endingTitle: "The next chapter is being written now.",
    endingBody: "Meet the people behind this journey and explore the research shaping what comes next.",
    researchLink: "Explore research",
    peopleLink: "Meet the team",
    threads: ["Parallel computing", "Distributed systems", "Scheduling", "Cloud computing", "Sensor networks", "Open education"],
  },
};

export default function HistoriaPage() {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const content = isPt ? copy.pt : copy.en;
  const prefersReducedMotion = useReducedMotion();
  const chaptersRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<HistoryEventKey>("1990");
  const [expandedId, setExpandedId] = useState<HistoryEventKey | null>("1990");
  const [progress, setProgress] = useState(0);

  const items = useMemo(() => EVENT_KEYS.map((id, index) => {
    const meta = eventMeta[id];
    return {
      id,
      index,
      icon: meta.icon,
      era: pick(meta.era, isPt),
      metric: meta.metric,
      metricLabel: pick(meta.metricLabel, isPt),
      photo: meta.photo,
      photoAlt: pick(meta.photoAlt, isPt),
      subjects: meta.subjects.map((subject) => pick(subject, isPt)),
      title: t(`history.events.${id}.title`),
      summary: t(`history.events.${id}.summary`),
      paragraphs: [1, 2, 3].map((number) => t(`history.events.${id}.p${number}`)),
    };
  }), [isPt, t]);

  const scrollToChapter = (id: HistoryEventKey) => {
    setActiveId(id);
    document.getElementById(`history-${id}`)?.scrollIntoView({
      behavior: prefersReducedMotion ? "instant" : "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const section = chaptersRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const visibleLine = Math.min(window.innerHeight * 0.45, 420);
      const available = Math.max(rect.height - window.innerHeight * 0.35, 1);
      const nextProgress = Math.max(0, Math.min(1, (visibleLine - rect.top) / available));
      setProgress((current) => Math.abs(current - nextProgress) > 0.005 ? nextProgress : current);

      let nearest: HistoryEventKey = "1990";
      let distance = Infinity;
      for (const item of items) {
        const node = document.getElementById(`history-${item.id}`);
        if (!node) continue;
        const currentDistance = Math.abs(node.getBoundingClientRect().top - visibleLine);
        if (currentDistance < distance) {
          distance = currentDistance;
          nearest = item.id;
        }
      }
      if (rect.top < window.innerHeight && rect.bottom > 0) setActiveId(nearest);
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  const reveal = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: prefersReducedMotion ? 0 : 0.65, ease: "easeOut" as const },
  };

  return (
    <div className="overflow-hidden">
      <section className="history-hero relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 top-0 h-[42rem] w-[42rem] rounded-full bg-primary/[0.07] blur-3xl dark:bg-primary/[0.08]" aria-hidden="true" />
        <div className="container relative mx-auto grid min-h-[650px] items-center gap-12 px-4 pb-16 pt-14 lg:grid-cols-[1.03fr_0.97fr] lg:gap-16 lg:pb-20 lg:pt-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.65 }}>
            <p className="mb-7 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">{content.eyebrow}</p>
            <h1 data-testid="history-title" className="max-w-3xl font-display text-[clamp(3.5rem,7vw,7rem)] font-bold leading-[0.92] tracking-[-0.065em] text-foreground">
              {content.headlineA} <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{content.headlineB}</span>
            </h1>
            <p data-testid="history-subtitle" className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{content.heroDescription}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#chapters" className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_34px_-18px_hsl(var(--primary))] transition-transform hover:-translate-y-0.5">
                {content.explore}<ArrowDown size={16} className="transition-transform group-hover:translate-y-1" />
              </a>
              <Link to="/people" className="group inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-card">
                {content.meetPeople}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          <motion.figure initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: 0.12 }} className="relative mx-auto w-full max-w-[620px] lg:ml-auto">
            <div className="absolute -left-5 -top-5 h-28 w-28 rounded-tl-[3rem] border-l border-t border-primary/35 sm:-left-8 sm:-top-8" aria-hidden="true" />
            <div className="relative aspect-[1.12] overflow-hidden rounded-[2rem] border border-border/75 bg-secondary shadow-[0_35px_90px_-50px_hsl(220_40%_2%/0.45)] sm:aspect-[1.05]">
              <img src={items[0].photo} alt={items[0].photoAlt} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent" />
              <div className="absolute right-7 top-4 font-display text-[7rem] font-bold leading-none tracking-[-0.09em] text-white/15 sm:right-10 sm:text-[9rem]" aria-hidden="true">90</div>
              <figcaption className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">{content.visualLabel}</span>
                <p className="mt-3 max-w-md font-display text-2xl font-semibold leading-tight sm:text-3xl">{items[0].title}</p>
                <span className="mt-5 block text-xs text-white/65">{content.illustrative}</span>
              </figcaption>
            </div>
            <div className="absolute -bottom-4 -right-3 flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-lg sm:-bottom-6 sm:-right-5">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="font-mono text-xs font-bold tracking-[0.14em] text-foreground">ICMC · USP</span>
            </div>
          </motion.figure>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-14 sm:pb-16" aria-label={isPt ? "A história em números" : "History in numbers"}>
        <div className="grid gap-7 border-y border-border/80 py-7 sm:grid-cols-3 sm:gap-0 sm:py-9">
          {[
            { value: "1990", label: content.yearsLabel },
            { value: "130+", label: content.alumniLabel },
            { value: "05", label: content.chaptersLabel },
          ].map((fact, index) => (
            <div key={fact.label} className={cn("flex items-center gap-4 sm:flex-col sm:items-start sm:gap-1 sm:px-8", index > 0 && "sm:border-l sm:border-border/80", index === 0 && "sm:pl-0")}>
              <span className="font-display text-4xl font-bold tracking-[-0.06em] text-foreground sm:text-5xl">{fact.value}</span>
              <span className="text-sm font-medium text-muted-foreground">{fact.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12 sm:pb-16">
        <motion.div {...reveal} className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">{content.introEyebrow}</p>
          <div>
            <h2 className="max-w-3xl font-display text-3xl font-bold leading-[1.08] tracking-[-0.05em] text-foreground sm:text-5xl">{content.introTitle}</h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">{content.introBody}</p>
          </div>
        </motion.div>
      </section>

      <nav className="sticky top-20 z-30 border-y border-border/75 bg-background/90 backdrop-blur-2xl" aria-label={content.navLabel}>
        <div className="container mx-auto overflow-x-auto px-4">
          <div className="flex min-w-[660px] items-stretch">
            {items.map((item) => {
              const isActive = activeId === item.id;
              return (
                <button key={item.id} type="button" onClick={() => scrollToChapter(item.id)} aria-current={isActive ? "step" : undefined} className={cn("group relative flex min-w-0 flex-1 items-center gap-3 px-3 py-4 text-left transition-colors hover:bg-primary/[0.05] sm:px-5", isActive && "bg-primary/[0.06]")}>
                  <span className={cn("font-mono text-[11px] font-bold transition-colors", isActive ? "text-accent" : "text-muted-foreground")}>0{item.index + 1}</span>
                  <span className={cn("truncate text-xs font-semibold transition-colors sm:text-sm", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>{item.era}</span>
                  {isActive && <motion.span layoutId="history-active-chapter" className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-gradient-to-r from-primary to-accent" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
                </button>
              );
            })}
          </div>
        </div>
        <motion.div className="absolute bottom-0 left-0 h-px w-full origin-left bg-primary/40" animate={{ scaleX: progress }} transition={{ duration: 0.25 }} aria-hidden="true" />
      </nav>

      <section id="chapters" ref={chaptersRef} className="container mx-auto px-4 py-8 sm:py-12">
        {items.map((item) => {
          const Icon = item.icon;
          const expanded = expandedId === item.id;
          return (
            <article key={item.id} id={`history-${item.id}`} data-history-id={item.id} data-testid={`history-item-${item.id}`} className="scroll-mt-44 border-b border-border/80 py-12 first:pt-6 last:border-b-0 sm:py-16 lg:py-20">
              <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                <motion.figure {...reveal} className={cn("relative min-w-0", item.index % 2 === 1 && "lg:order-2")}>
                  <div className="group relative aspect-[1.18] overflow-hidden rounded-[1.6rem] border border-border/70 bg-secondary sm:aspect-[1.28]">
                    <img src={item.photo} alt={item.photoAlt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <span className="absolute left-6 top-5 font-display text-[5rem] font-bold leading-none tracking-[-0.08em] text-white/20 sm:left-8 sm:text-[7rem]" aria-hidden="true">0{item.index + 1}</span>
                    <figcaption className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 text-white sm:bottom-8 sm:left-8 sm:right-8">
                      <div>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">{item.metricLabel}</span>
                        <p className="mt-1 font-display text-3xl font-bold sm:text-4xl">{item.metric}</p>
                      </div>
                      <span className="text-right text-[11px] text-white/70">{content.illustrative}</span>
                    </figcaption>
                  </div>
                </motion.figure>

                <motion.div {...reveal} className={cn("min-w-0", item.index % 2 === 1 && "lg:order-1")}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={20} /></span>
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">{content.chapterLabel} 0{item.index + 1} <span className="mx-1 text-muted-foreground">/</span> {item.era}</span>
                  </div>
                  <h3 className="max-w-xl font-display text-3xl font-bold leading-[1.07] tracking-[-0.045em] text-foreground sm:text-4xl lg:text-5xl">{item.title}</h3>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{item.summary}</p>
                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-foreground/85 sm:text-base">{item.paragraphs[0]}</p>

                  <div id={`history-details-${item.id}`}>
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div key="details" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.35 }} className="overflow-hidden" data-testid={`history-expanded-${item.id}`}>
                          <div className="space-y-4 pt-4">
                            {item.paragraphs.slice(1).map((paragraph) => <p key={paragraph} className="max-w-xl text-sm leading-relaxed text-foreground/85 sm:text-base">{paragraph}</p>)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button type="button" onClick={() => setExpandedId(expanded ? null : item.id)} aria-expanded={expanded} aria-controls={`history-details-${item.id}`} className="group mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent">
                    {expanded ? content.less : content.more}<ChevronDown size={17} className={cn("transition-transform", expanded && "rotate-180")} />
                  </button>
                  <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/80 pt-5">
                    {item.subjects.map((subject) => <span key={subject} className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{subject}</span>)}
                  </div>
                </motion.div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="container mx-auto px-4 py-14 sm:py-20">
        <motion.div {...reveal} className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">{content.threadsEyebrow}</p>
            <h2 className="mt-5 max-w-lg font-display text-3xl font-bold leading-[1.07] tracking-[-0.045em] text-foreground sm:text-5xl">{content.threadsTitle}</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">{content.threadsBody}</p>
          </div>
          <div className="grid sm:grid-cols-2 sm:gap-x-8">
            {content.threads.map((thread, index) => (
              <div key={thread} className="group flex items-center gap-4 border-b border-border/80 py-5">
                <span className="font-mono text-xs font-bold text-primary/65">0{index + 1}</span>
                <span className="font-display text-lg font-semibold text-foreground transition-transform duration-300 group-hover:translate-x-1 sm:text-xl">{thread}</span>
                <BookOpenText size={17} className="ml-auto shrink-0 text-accent/70" />
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative overflow-hidden bg-primary py-16 text-primary-foreground sm:py-20">
        <div className="pointer-events-none absolute -right-32 -top-48 h-[34rem] w-[34rem] rounded-full border border-white/15" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-12 -top-28 h-[25rem] w-[25rem] rounded-full border border-white/15" aria-hidden="true" />
        <div className="container relative mx-auto grid gap-8 px-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/75">{content.endingEyebrow}</p>
            <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.05em] sm:text-5xl lg:text-6xl">{content.endingTitle}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/80">{content.endingBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/research" className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5">{content.researchLink}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
            <Link to="/people" className="group inline-flex items-center gap-2 rounded-xl border border-white/35 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10">{content.peopleLink}<Users size={16} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
