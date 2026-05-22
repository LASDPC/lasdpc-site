import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpenText,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Cpu,
  GraduationCap,
  Landmark,
  Network,
  Sparkles,
  Users,
} from "lucide-react";

import { useLang } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

type HistoryEventKey = "1990" | "gsdpc" | "evolution" | "training" | "today";
type Localized = { pt: string; en: string };
type HistoryIcon = ComponentType<{ className?: string; size?: number }>;

const EVENT_KEYS: HistoryEventKey[] = ["1990", "gsdpc", "evolution", "training", "today"];

const pick = (value: Localized, isPt: boolean) => (isPt ? value.pt : value.en);

const eventMeta: Record<
  HistoryEventKey,
  {
    icon: HistoryIcon;
    photo: string;
    photoAlt: Localized;
    metric: Localized;
    metricLabel: Localized;
    subjects: Localized[];
  }
> = {
  "1990": {
    icon: CalendarDays,
    photo: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1400&h=1050&fit=crop",
    photoAlt: {
      pt: "Sala de trabalho universitária representando o começo do laboratório",
      en: "University workspace representing the lab's early days",
    },
    metric: { pt: "1990", en: "1990" },
    metricLabel: { pt: "ano de origem", en: "origin year" },
    subjects: [
      { pt: "ICMC/USP", en: "ICMC/USP" },
      { pt: "sistemas distribuídos", en: "distributed systems" },
      { pt: "programação concorrente", en: "concurrent programming" },
    ],
  },
  gsdpc: {
    icon: Network,
    photo: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1400&h=1050&fit=crop",
    photoAlt: {
      pt: "Corredor de servidores representando infraestrutura de pesquisa distribuída",
      en: "Server corridor representing distributed research infrastructure",
    },
    metric: { pt: "GSDPC", en: "GSDPC" },
    metricLabel: { pt: "grupo de pesquisa", en: "research group" },
    subjects: [
      { pt: "base de pesquisa", en: "research home" },
      { pt: "continuidade", en: "continuity" },
      { pt: "colaboração", en: "collaboration" },
    ],
  },
  evolution: {
    icon: Cpu,
    photo: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&h=1050&fit=crop",
    photoAlt: {
      pt: "Placa eletrônica representando a evolução dos sistemas paralelos e distribuídos",
      en: "Circuit board representing the evolution of parallel and distributed systems",
    },
    metric: { pt: "1990-2000", en: "1990-2000" },
    metricLabel: { pt: "expansão técnica", en: "technical expansion" },
    subjects: [
      { pt: "algoritmos paralelos", en: "parallel algorithms" },
      { pt: "redes", en: "networks" },
      { pt: "avaliação de desempenho", en: "performance evaluation" },
    ],
  },
  training: {
    icon: GraduationCap,
    photo: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&h=1050&fit=crop",
    photoAlt: {
      pt: "Grupo de estudantes trabalhando junto em uma mesa",
      en: "Group of students working together at a table",
    },
    metric: { pt: "130+", en: "130+" },
    metricLabel: { pt: "mestres e doutores", en: "MSc and PhD alumni" },
    subjects: [
      { pt: "formação", en: "training" },
      { pt: "egressos", en: "alumni" },
      { pt: "iniciação científica", en: "undergraduate research" },
    ],
  },
  today: {
    icon: BrainCircuit,
    photo: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1400&h=1050&fit=crop",
    photoAlt: {
      pt: "Equipe de tecnologia trabalhando em notebooks em um laboratório moderno",
      en: "Technology team working on laptops in a modern lab",
    },
    metric: { pt: "Hoje", en: "Today" },
    metricLabel: { pt: "pesquisa em movimento", en: "research in motion" },
    subjects: [
      { pt: "nuvem", en: "cloud" },
      { pt: "computação verde", en: "green computing" },
      { pt: "educação aberta", en: "open education" },
    ],
  },
};

const pageCopy = {
  pt: {
    spotlight: "Marco em destaque",
    chapterLabel: "Capítulos",
    chapterIntro: "A trajetória do LaSDPC contada por marcos, pessoas e linhas de pesquisa.",
    storyTitle: "Uma história que continua compilando",
    storyBody:
      "O laboratório nasceu de uma missão acadêmica clara e cresceu como um espaço de pesquisa aplicada, formação de pessoas e experimentação em sistemas distribuídos.",
    impactTitle: "O que ficou mais forte com o tempo",
    impactSubtitle:
      "A evolução do laboratório combina origem acadêmica, grupo de pesquisa, infraestrutura, formação de pessoas e temas atuais em uma mesma trajetória.",
    researchTitle: "Linhas que conectam passado e presente",
    researchBody:
      "A base em sistemas paralelos e distribuídos se desdobrou em nuvem, desempenho, aplicações adaptativas, educação computacional e novas formas de computação em escala.",
    expandDetails: "Ver detalhes",
    collapseDetails: "Ocultar detalhes",
    impactCards: [
      {
        icon: Users,
        title: "Comunidade",
        body: "Gerações de docentes, pós-graduandos e estudantes de iniciação científica criando continuidade.",
      },
      {
        icon: Cpu,
        title: "Sistemas",
        body: "Pesquisa com engenharia, experimentação e avaliação de desempenho como assinatura do laboratório.",
      },
      {
        icon: Sparkles,
        title: "Futuro",
        body: "Novas frentes em nuvem, aplicações adaptativas, computação verde e educação aberta.",
      },
    ],
    researchThreads: [
      "Computação paralela",
      "Sistemas distribuídos",
      "Escalonamento",
      "Computação em nuvem",
      "Web services",
      "Redes de sensores",
      "Computação móvel",
      "Objetos de aprendizagem",
    ],
  },
  en: {
    spotlight: "Featured milestone",
    chapterLabel: "Chapters",
    chapterIntro: "LaSDPC's journey told through milestones, people, and research threads.",
    storyTitle: "A history that keeps compiling",
    storyBody:
      "The lab began with a clear academic mission and grew into a place for applied research, mentoring, and experimentation in distributed systems.",
    impactTitle: "What grew stronger over time",
    impactSubtitle:
      "The lab's evolution combines academic origins, research group continuity, infrastructure, training, and current themes into one connected trajectory.",
    researchTitle: "Threads connecting past and present",
    researchBody:
      "The foundation in parallel and distributed systems unfolded into cloud computing, performance, adaptive applications, educational computing, and new forms of computing at scale.",
    expandDetails: "Show details",
    collapseDetails: "Hide details",
    impactCards: [
      {
        icon: Users,
        title: "Community",
        body: "Generations of faculty, graduate students, and undergraduate researchers creating continuity.",
      },
      {
        icon: Cpu,
        title: "Systems",
        body: "Research shaped by engineering, experimentation, and performance evaluation.",
      },
      {
        icon: Sparkles,
        title: "Future",
        body: "New fronts in cloud, adaptive applications, green computing, and open education.",
      },
    ],
    researchThreads: [
      "Parallel computing",
      "Distributed systems",
      "Scheduling",
      "Cloud computing",
      "Web services",
      "Sensor networks",
      "Mobile computing",
      "Learning objects",
    ],
  },
};

export default function HistoriaPage() {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const copy = isPt ? pageCopy.pt : pageCopy.en;
  const [activeId, setActiveId] = useState<HistoryEventKey>("1990");
  const [openIds, setOpenIds] = useState<Set<HistoryEventKey>>(() => new Set());

  const items = useMemo(
    () =>
      EVENT_KEYS.map((id) => {
        const meta = eventMeta[id];
        return {
          id,
          icon: meta.icon,
          photo: meta.photo,
          photoAlt: pick(meta.photoAlt, isPt),
          metric: pick(meta.metric, isPt),
          metricLabel: pick(meta.metricLabel, isPt),
          subjects: meta.subjects.map((subject) => pick(subject, isPt)),
          year:
            id === "1990"
              ? "1990"
              : id === "gsdpc"
                ? "1990"
                : id === "evolution"
                  ? "1990-2000"
                  : t("history.todayLabel") || "Hoje",
          title: t(`history.events.${id}.title`),
          summary: t(`history.events.${id}.summary`),
          paragraphs: [
            t(`history.events.${id}.p1`),
            t(`history.events.${id}.p2`),
            t(`history.events.${id}.p3`),
          ].filter((p) => p && !p.startsWith("history.events.")),
          imageCaption: t(`history.events.${id}.imageCaption`),
        };
      }),
    [isPt, t]
  );

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId)
  );
  const activeItem = items[activeIndex] ?? items[0];
  const ActiveIcon = activeItem.icon;

  const toggle = (id: HistoryEventKey) => {
    setActiveId(id);
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const centeredEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const nextId = centeredEntry?.target.getAttribute("data-history-id") as HistoryEventKey | null;
        if (nextId) setActiveId(nextId);
      },
      { rootMargin: "-32% 0px -48% 0px", threshold: [0.2, 0.45, 0.7] }
    );

    items.forEach((item) => {
      const node = document.querySelector<HTMLElement>(`[data-history-id="${item.id}"]`);
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <div>
      <PageHeader
        icon={Landmark}
        title={t("history.title")}
        titleTestId="history-title"
        subtitle={<span data-testid="history-subtitle">{t("history.subtitle")}</span>}
      />

      <section className="container mx-auto px-4 pb-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] lg:items-stretch">
          <motion.div
            layout
            className="relative min-h-[420px] overflow-hidden rounded-lg border border-border bg-card shadow-sm"
          >
            <img
              key={activeItem.photo}
              src={activeItem.photo}
              alt={activeItem.photoAlt}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background)/0.95)_0%,hsl(var(--background)/0.72)_45%,hsl(var(--background)/0.18)_100%)]" />
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

            <div className="relative flex min-h-[420px] max-w-2xl flex-col justify-end p-5 sm:p-8">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-md border border-border bg-background/85 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground backdrop-blur">
                <ActiveIcon className="h-4 w-4 text-primary" />
                {copy.spotlight}
              </div>

              <div className="max-w-xl">
                <p className="font-mono text-sm font-semibold text-accent">{activeItem.year}</p>
                <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                  {activeItem.title}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {activeItem.summary}
                </p>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <div className="rounded-lg border border-border bg-background/85 px-4 py-3 backdrop-blur">
                  <span className="block font-mono text-xs font-semibold uppercase text-muted-foreground">
                    {activeItem.metricLabel}
                  </span>
                  <span className="mt-1 block font-display text-2xl font-bold text-foreground">
                    {activeItem.metric}
                  </span>
                </div>
                {activeItem.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-md border border-border bg-background/80 px-3 py-2 text-xs font-semibold text-foreground backdrop-blur"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                {copy.chapterLabel}
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold text-foreground">{copy.storyTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.storyBody}</p>
            </div>

            <div className="rounded-lg border border-border bg-background p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ActiveIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {copy.spotlight}
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">{activeItem.year}</p>
                </div>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold leading-tight text-foreground">
                {activeItem.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{activeItem.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {activeItem.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-md border border-border bg-secondary/70 px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="sticky top-16 z-30 border-y border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="hidden min-w-0 sm:block">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                {copy.chapterLabel}
              </p>
              <p className="max-w-[260px] truncate text-sm font-semibold text-foreground">{activeItem.title}</p>
            </div>

            <div className="relative flex-1 py-2">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border" />
              <motion.div
                layout
                className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-primary"
                style={{ width: `${(activeIndex / Math.max(items.length - 1, 1)) * 100}%` }}
              />

              <div className="relative grid grid-cols-5 gap-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === activeId;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveId(item.id)}
                      className="group flex min-w-0 flex-col items-center gap-1"
                      aria-label={item.title}
                      aria-current={isActive ? "step" : undefined}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground group-hover:border-primary group-hover:text-primary"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={cn(
                          "hidden max-w-full truncate px-1 text-[11px] font-semibold md:block",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {item.year}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="border-b border-border bg-secondary/40">
        <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-lg border border-border bg-background p-5 lg:sticky lg:top-36 lg:self-start">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              {copy.chapterLabel}
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-foreground">{copy.chapterIntro}</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5">
              <div>
                <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">
                  {activeItem.metricLabel}
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">{activeItem.metric}</p>
              </div>
              <div>
                <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">
                  {activeItem.year}
                </p>
                <p className="mt-1 text-sm font-semibold leading-snug text-foreground">{activeItem.title}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((item, i) => {
              const Icon = item.icon;
              const isOpen = openIds.has(item.id);
              const isActive = activeId === item.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.04, duration: 0.35, ease: "easeOut" }}
                  className={cn(
                    "overflow-hidden rounded-lg border bg-background transition-colors",
                    isActive ? "border-primary shadow-sm" : "border-border hover:border-primary/40"
                  )}
                  data-testid={`history-item-${item.id}`}
                  data-history-id={item.id}
                  onMouseEnter={() => setActiveId(item.id)}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className="grid w-full text-left md:grid-cols-[190px_minmax(0,1fr)]"
                    aria-pressed={isActive}
                  >
                    <div className="relative min-h-[170px] overflow-hidden bg-muted md:min-h-full">
                      <img
                        src={item.photo}
                        alt={item.photoAlt}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_10%,hsl(var(--foreground)/0.74)_100%)]" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <span className="font-mono text-xs font-semibold uppercase opacity-85">{item.year}</span>
                        <p className="mt-1 text-2xl font-bold leading-none">{item.metric}</p>
                        <p className="mt-1 text-xs font-medium opacity-85">{item.metricLabel}</p>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                            <Icon className="h-4 w-4" />
                            {item.year}
                          </div>
                          <h3 className="mt-3 font-display text-xl font-bold leading-tight text-foreground">
                            {item.title}
                          </h3>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {item.subjects.map((subject) => (
                          <span
                            key={subject}
                            className="rounded-md border border-border bg-secondary/70 px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 sm:px-6">
                    <p className="text-xs text-muted-foreground">{item.imageCaption}</p>
                    <Button
                      variant={isOpen ? "default" : "outline"}
                      size="icon"
                      onClick={() => toggle(item.id)}
                      className="shrink-0"
                      data-testid={`history-toggle-${item.id}`}
                      aria-expanded={isOpen}
                      aria-label={isOpen ? copy.collapseDetails : copy.expandDetails}
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        key="expanded"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden"
                        data-testid={`history-expanded-${item.id}`}
                      >
                        <div className="grid gap-5 border-t border-border bg-card/50 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_240px]">
                          <div className="space-y-3">
                            {item.paragraphs.map((paragraph, idx) => (
                              <p key={idx} className="text-sm leading-relaxed text-foreground">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                          <div className="rounded-lg border border-border bg-background p-4">
                            <Icon className="h-6 w-6 text-primary" />
                            <p className="mt-3 font-mono text-xs font-semibold uppercase text-muted-foreground">
                              {item.metricLabel}
                            </p>
                            <p className="mt-1 font-display text-3xl font-bold text-foreground">{item.metric}</p>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
              {copy.impactTitle}
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-foreground">
              {copy.researchTitle}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{copy.researchBody}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {copy.researchThreads.map((thread, index) => (
              <motion.div
                key={thread}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.03, duration: 0.25 }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <BookOpenText className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-foreground">{thread}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold text-foreground">{copy.impactTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{copy.impactSubtitle}</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {copy.impactCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                  className="rounded-lg border border-border bg-background p-5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
