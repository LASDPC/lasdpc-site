import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ExternalLink,
  FlaskConical,
  Network,
  Server,
  Sparkles,
  Users,
} from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useProjects } from "@/hooks/useProjects";
import { usePublications } from "@/hooks/usePublications";
import { useBlog } from "@/hooks/useBlog";
import { useStats } from "@/hooks/useStats";
import { Skeleton } from "@/components/ui/skeleton";
import uspLogo from "@/assets/usp.svg";
import { mediaUrl } from "@/lib/media";
import VantaGlobeBackground from "@/components/VantaGlobeBackground";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.07, duration: 0.55, ease: "easeOut" },
  }),
};

const HomePageSkeleton = () => (
  <div className="container mx-auto px-4 py-16">
    <div className="grid min-h-[70vh] items-center gap-12 lg:grid-cols-2">
      <div className="space-y-6">
        <Skeleton className="h-8 w-56 rounded-full" />
        <Skeleton className="h-20 w-full max-w-2xl" />
        <Skeleton className="h-20 w-full max-w-xl" />
        <div className="flex gap-3"><Skeleton className="h-12 w-44 rounded-xl" /><Skeleton className="h-12 w-36 rounded-xl" /></div>
      </div>
      <Skeleton className="aspect-square w-full max-w-xl justify-self-end rounded-[2rem]" />
    </div>
  </div>
);

const HomePage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: publications = [], isLoading: loadingPubs } = usePublications();
  const { data: blog = [], isLoading: loadingBlog } = useBlog();
  const { data: stats, isLoading: loadingStats } = useStats();
  const [activeGalleryItem, setActiveGalleryItem] = useState(0);
  const [galleryPaused, setGalleryPaused] = useState(false);

  useEffect(() => {
    if (galleryPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => setActiveGalleryItem((current) => (current + 1) % 3), 6000);
    return () => window.clearInterval(interval);
  }, [galleryPaused]);

  if (loadingProjects || loadingPubs || loadingBlog || loadingStats) return <HomePageSkeleton />;

  const researchAreas = [
    {
      icon: Network,
      code: "01",
      title: isPt ? "Sistemas distribuídos" : "Distributed systems",
      description: isPt
        ? "Arquiteturas resilientes e escaláveis para conectar serviços, dados e pessoas."
        : "Resilient, scalable architectures connecting services, data and people.",
    },
    {
      icon: Cpu,
      code: "02",
      title: isPt ? "Computação de alto desempenho" : "High-performance computing",
      description: isPt
        ? "Paralelismo, escalonamento e infraestrutura para problemas de grande escala."
        : "Parallelism, scheduling and infrastructure for large-scale problems.",
    },
    {
      icon: BrainCircuit,
      code: "03",
      title: isPt ? "Inteligência artificial" : "Artificial intelligence",
      description: isPt
        ? "IA eficiente e responsável aplicada a desafios científicos e sociais."
        : "Efficient, responsible AI applied to scientific and social challenges.",
    },
  ];

  const metrics = [
    { icon: Users, value: stats?.researchers ?? "—", label: isPt ? "Pesquisadores" : "Researchers" },
    { icon: BookOpen, value: stats?.publications ?? "—", label: isPt ? "Publicações" : "Publications" },
    { icon: Server, value: stats?.clusters ?? "—", label: "Clusters HPC" },
  ];

  const galleryItems = [
    {
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1800&q=85",
      eyebrow: isPt ? "Infraestrutura de pesquisa" : "Research infrastructure",
      title: isPt ? "Tecnologia preparada para perguntas ambiciosas." : "Technology ready for ambitious questions.",
      description: isPt ? "Clusters, redes e sistemas que transformam experimentos complexos em conhecimento compartilhado." : "Clusters, networks, and systems turning complex experiments into shared knowledge.",
    },
    {
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1800&q=85",
      eyebrow: isPt ? "Computação em profundidade" : "Computing in depth",
      title: isPt ? "Da arquitetura ao impacto real." : "From architecture to real-world impact.",
      description: isPt ? "Investigamos cada camada da computação para construir soluções eficientes, resilientes e responsáveis." : "We investigate every layer of computing to build efficient, resilient, and responsible solutions.",
    },
    {
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1800&q=85",
      eyebrow: isPt ? "Ciência colaborativa" : "Collaborative science",
      title: isPt ? "Conhecimento cresce quando circula." : "Knowledge grows when it circulates.",
      description: isPt ? "Pessoas, ideias e diferentes áreas conectadas para ampliar o alcance de cada descoberta." : "People, ideas, and disciplines connected to expand the reach of every discovery.",
    },
  ];

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[calc(100svh-5rem)]">
        <div className="hero-copy-backdrop pointer-events-none absolute inset-y-0 left-0 w-full lg:w-[72%]" aria-hidden="true" />
        <div className="container mx-auto grid min-h-[calc(100svh-5rem)] items-center gap-12 px-4 pb-24 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <motion.div initial="hidden" animate="visible" className="relative z-10 max-w-3xl">
            <motion.div
              variants={reveal}
              custom={0}
              className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-2"
            >
              <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-foreground/75 dark:text-foreground/80">
                {isPt ? "Laboratório de Sistemas Distribuídos da" : "Distributed Systems Laboratory at"}
              </span>
              <span
                role="img"
                aria-label="Universidade de São Paulo"
                className="usp-institutional-mark h-5 w-14 shrink-0"
                style={{ maskImage: `url(${uspLogo})`, WebkitMaskImage: `url(${uspLogo})` }}
              />
            </motion.div>
            <motion.h1 variants={reveal} custom={1} className="max-w-4xl font-display text-[clamp(3.25rem,7.6vw,7.25rem)] font-bold leading-[0.9] tracking-[-0.065em] text-foreground">
              {isPt ? "Computação que" : "Computing that"}{" "}
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                {isPt ? "conecta." : "connects."}
              </span>
            </motion.h1>
            <motion.p variants={reveal} custom={2} className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("hero.subtitle")}
            </motion.p>

            <motion.div variants={reveal} custom={3} className="mt-9 flex flex-wrap gap-3">
              <Link to="/research" className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_35px_-16px_hsl(var(--primary))] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-14px_hsl(var(--primary))]">
                {t("hero.cta.explore")} <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/people" className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/90 px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur-xl hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card dark:bg-card/75">
                {isPt ? "Conheça o laboratório" : "Meet the lab"}
              </Link>
            </motion.div>

            <motion.div variants={reveal} custom={4} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-muted-foreground">
              {["HPC", "Cloud", "Edge AI", isPt ? "Sistemas adaptativos" : "Adaptive systems"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{item}</span>
              ))}
            </motion.div>
          </motion.div>

          <div className="hidden min-h-[34rem] lg:block" aria-hidden="true" />
        </div>

        <a href="#areas" aria-label={isPt ? "Explorar conteúdo" : "Explore content"} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground md:flex">
          {isPt ? "Descubra" : "Discover"}<ArrowDown size={18} className="animate-bounce" />
        </a>
      </section>

      <section className="container mx-auto px-4 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative">
            <div className="mb-7 flex flex-col justify-between gap-4 px-1 sm:flex-row sm:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/90 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur dark:bg-background/70">
                  <span className="signal-pulse h-1.5 w-1.5 rounded-full bg-accent" />
                  {isPt ? "Dados do laboratório" : "Lab data"}
                </div>
                <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                  {isPt ? "Impacto em números" : "Impact in numbers"}
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {isPt ? "Pessoas, conhecimento e infraestrutura que sustentam nossa pesquisa." : "People, knowledge and infrastructure powering our research."}
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
              <div className="group relative flex min-h-64 flex-col overflow-hidden rounded-[1.6rem] border border-primary/15 bg-primary p-6 text-primary-foreground sm:p-7">
                <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full border border-white/10" />
                <div className="absolute -bottom-12 -right-6 h-44 w-44 rounded-full border border-white/10" />
                <div className="flex items-start justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Users size={19} /></span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground/70">Comunidade</span>
                </div>
                <div className="relative mt-auto">
                  <p className="font-display text-6xl font-bold tracking-[-0.06em]">{metrics[0].value}</p>
                  <p className="mt-1 text-sm font-semibold">{metrics[0].label}</p>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-primary-foreground/65">
                    {isPt ? "Docentes, estudantes e colaboradores construindo pesquisa juntos." : "Faculty, students and collaborators building research together."}
                  </p>
                  <div className="mt-5 flex -space-x-2">
                    {["MS", "RS", "JE", "SB", "+"].map((initials, index) => (
                      <span key={initials} className="grid h-8 w-8 place-items-center rounded-full border-2 border-primary bg-white/15 text-[9px] font-bold" style={{ zIndex: 5 - index }}>{initials}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex min-h-64 flex-col rounded-[1.6rem] border border-border/80 bg-background/90 p-6 backdrop-blur-xl sm:p-7 dark:bg-background/70">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><BookOpen size={18} /></span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-accent">Open science</span>
                </div>
                <div className="mt-auto flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-5xl font-bold tracking-[-0.05em] text-foreground">{metrics[1].value}</p>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">{metrics[1].label}</p>
                  </div>
                  <div className="flex h-16 items-end gap-1.5" aria-hidden="true">
                    {[35, 52, 44, 68, 60, 86].map((height, index) => (
                      <span key={index} className={`w-2 rounded-full ${index === 5 ? "bg-accent" : "bg-primary/25"}`} style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex min-h-64 flex-col rounded-[1.6rem] border border-border/80 bg-background/90 p-6 backdrop-blur-xl sm:p-7 dark:bg-background/70">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent"><Server size={18} /></span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Online</span>
                </div>
                <div className="mt-auto flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-5xl font-bold tracking-[-0.05em] text-foreground">{metrics[2].value}</p>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">{metrics[2].label}</p>
                  </div>
                  <div className="space-y-2" aria-hidden="true">
                    {[0, 1, 2].map((item) => (
                      <span key={item} className="flex h-3 w-16 items-center rounded-full bg-secondary px-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /></span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="areas" className="container mx-auto px-4 py-12 sm:py-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={reveal} className="mb-12">
          <div>
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">{isPt ? "O que investigamos" : "What we investigate"}</p>
            <h2 className="max-w-2xl font-display text-4xl font-bold leading-tight tracking-[-0.045em] text-foreground sm:text-5xl">
              {isPt ? "Problemas complexos pedem pesquisa conectada." : "Complex problems call for connected research."}
            </h2>
          </div>
        </motion.div>

        <div className="relative grid border-y border-border/80 lg:grid-cols-3">
          {researchAreas.map(({ icon: Icon, code, title, description }, index) => (
            <motion.article
              key={title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={reveal}
              custom={index}
              className={`group relative flex min-h-[270px] flex-col border-b border-border/70 py-9 last:border-b-0 lg:border-b-0 lg:px-10 lg:py-11 ${index > 0 ? "lg:border-l" : "lg:pl-0"} ${index === researchAreas.length - 1 ? "lg:pr-0" : ""}`}
            >
              <div className="flex items-start justify-between">
                <Icon size={27} className="text-primary transition-transform duration-300 group-hover:scale-110" />
                <span className="font-mono text-4xl leading-none text-primary/10 transition-colors group-hover:text-primary/20">/{code}</span>
              </div>
              <div className="mt-auto">
                <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground transition-transform duration-300 group-hover:translate-x-1">{title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
                <span className="mt-6 block h-0.5 w-10 bg-accent transition-all duration-300 group-hover:w-20" />
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={reveal}
          className="group relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-[0_28px_80px_-48px_hsl(220_40%_2%/0.5)] sm:rounded-[2.25rem]"
          onMouseEnter={() => setGalleryPaused(true)}
          onMouseLeave={() => setGalleryPaused(false)}
          onFocus={() => setGalleryPaused(true)}
          onBlur={() => setGalleryPaused(false)}
        >
          <div className="relative min-h-[430px] sm:min-h-[520px] lg:min-h-[590px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={activeGalleryItem}
                initial={{ opacity: 0, scale: 1.025 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.08}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) setActiveGalleryItem((current) => (current + 1) % galleryItems.length);
                  if (info.offset.x > 60) setActiveGalleryItem((current) => (current - 1 + galleryItems.length) % galleryItems.length);
                }}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
              >
                <img
                  src={galleryItems[activeGalleryItem].image}
                  alt=""
                  className="absolute inset-0 h-full w-full select-none object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/5" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 via-transparent to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 max-w-4xl p-7 text-white sm:p-10 lg:p-14">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">{galleryItems[activeGalleryItem].eyebrow}</span>
                    <span className="h-px w-10 bg-white/35" />
                    <span className="font-mono text-[11px] font-bold text-white/70">0{activeGalleryItem + 1} / 0{galleryItems.length}</span>
                  </div>
                  <h2 className="max-w-3xl font-display text-3xl font-bold leading-[1.05] tracking-[-0.045em] sm:text-5xl lg:text-6xl">{galleryItems[activeGalleryItem].title}</h2>
                  <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-white/75 sm:text-base">{galleryItems[activeGalleryItem].description}</p>
                </figcaption>
              </motion.figure>
            </AnimatePresence>

            <div className="absolute right-5 top-5 z-10 flex gap-2 sm:right-8 sm:top-8">
              <button type="button" onClick={() => setActiveGalleryItem((current) => (current - 1 + galleryItems.length) % galleryItems.length)} aria-label={isPt ? "Imagem anterior" : "Previous image"} className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-slate-950/35 text-white backdrop-blur-md transition hover:border-white/45 hover:bg-slate-950/60"><ChevronLeft size={19} /></button>
              <button type="button" onClick={() => setActiveGalleryItem((current) => (current + 1) % galleryItems.length)} aria-label={isPt ? "Próxima imagem" : "Next image"} className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-slate-950/35 text-white backdrop-blur-md transition hover:border-white/45 hover:bg-slate-950/60"><ChevronRight size={19} /></button>
            </div>

            <div className="absolute bottom-7 right-7 z-10 hidden items-center gap-2 sm:flex lg:bottom-14 lg:right-14">
              {galleryItems.map((item, index) => (
                <button key={item.title} type="button" onClick={() => setActiveGalleryItem(index)} aria-label={`${isPt ? "Exibir imagem" : "Show image"} ${index + 1}`} aria-current={activeGalleryItem === index ? "true" : undefined} className={`h-1.5 rounded-full transition-all ${activeGalleryItem === index ? "w-10 bg-white" : "w-5 bg-white/35 hover:bg-white/60"}`} />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="surface-panel overflow-hidden rounded-[2rem]">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              <div className="relative overflow-hidden bg-primary p-8 text-primary-foreground sm:p-12">
                <div className="tech-grid absolute inset-0 opacity-25" />
                <div className="relative">
                  <span className="mb-10 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Sparkles size={22} /></span>
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/75">{isPt ? "Pesquisa & impacto" : "Research & impact"}</p>
                  <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl">{isPt ? "Ideias que saem do laboratório." : "Ideas that move beyond the lab."}</h2>
                  <p className="mt-5 max-w-md text-sm leading-relaxed text-primary-foreground/75">{isPt ? "Projetos abertos à colaboração, formação de pessoas e soluções que aproximam ciência e sociedade." : "Projects open to collaboration, developing people and bringing science closer to society."}</p>
                </div>
              </div>

              <div className="divide-y divide-border/70">
                {projects.length > 0 ? projects.slice(0, 3).map((project, index) => (
                  <Link key={project.id} to={`/research/${project.id}`} className="group flex min-h-40 items-start gap-5 p-7 hover:bg-primary/[0.04] sm:p-9">
                    <span className="mt-1 font-mono text-xs text-muted-foreground">0{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap gap-2">{project.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">{tag}</span>)}</div>
                      <h3 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{isPt ? project.titlePt : project.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{isPt ? project.descriptionPt : project.description}</p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"><ArrowRight size={15} /></span>
                  </Link>
                )) : (
                  <div className="grid min-h-[480px] place-items-center p-10 text-center">
                    <div><FlaskConical className="mx-auto mb-4 text-primary" size={34} /><p className="font-display text-xl font-semibold">{isPt ? "Novos projetos em breve" : "New projects coming soon"}</p><p className="mt-2 text-sm text-muted-foreground">{isPt ? "Estamos preparando esta seleção." : "We are preparing this selection."}</p></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal}>
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">{isPt ? "Conhecimento aberto" : "Open knowledge"}</p>
            <h2 className="font-display text-4xl font-bold leading-tight tracking-[-0.045em] text-foreground sm:text-5xl">{t("section.publications")}</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">{isPt ? "Resultados recentes, construídos em colaboração e compartilhados com a comunidade científica." : "Recent results, built collaboratively and shared with the scientific community."}</p>
            <Link to="/research" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary">{isPt ? "Explorar acervo" : "Explore archive"}<ArrowRight size={15} /></Link>
          </motion.div>

          <div className="space-y-3">
            {publications.length > 0 ? publications.slice(0, 4).map((publication, index) => {
              const localizedTitle = (isPt ? publication.titlePt : publication.title) || publication.title || publication.titlePt || publication.venue;
              const destination = publication.doi || "/research";

              return (
                <motion.a
                  key={publication.id}
                  href={destination}
                  target={publication.doi ? "_blank" : undefined}
                  rel={publication.doi ? "noopener noreferrer" : undefined}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={reveal}
                  custom={index}
                  aria-label={`${localizedTitle} — ${publication.year}`}
                  className="group relative flex min-h-[112px] items-center gap-5 overflow-hidden rounded-2xl border border-border/80 bg-card/70 p-5 shadow-[0_16px_40px_-38px_hsl(220_40%_2%/0.45)] backdrop-blur-sm transition-all duration-300 before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:origin-center before:scale-y-0 before:rounded-full before:bg-gradient-to-b before:from-primary before:to-accent before:transition-transform hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-[0_20px_45px_-34px_hsl(var(--primary)/0.4)] hover:before:scale-y-100 sm:gap-6 sm:p-6"
                >
                  <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border/80 bg-background font-mono text-[10px] font-bold text-primary shadow-sm sm:h-14 sm:w-14">
                    {publication.year}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-accent">{publication.type || (isPt ? "Publicação" : "Publication")}</span>
                      {publication.venue && localizedTitle !== publication.venue && <span className="line-clamp-1 text-[11px] text-muted-foreground">{publication.venue}</span>}
                    </div>
                    <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">{localizedTitle}</h3>
                    <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{publication.authors}</p>
                  </div>
                  <span className="hidden shrink-0 items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-primary sm:flex">
                    {isPt ? "Acessar" : "Open"}
                    <ExternalLink size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </motion.a>
              );
            }) : <div className="surface-panel rounded-2xl p-10 text-center text-sm text-muted-foreground">{isPt ? "Publicações serão exibidas aqui." : "Publications will appear here."}</div>}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-end justify-between gap-5">
            <div>
              <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">{isPt ? "Diário do laboratório" : "Lab journal"}</p>
              <h2 className="font-display text-4xl font-bold tracking-[-0.045em] text-foreground sm:text-5xl">{t("section.blog")}</h2>
            </div>
            <Link to="/blog" className="group hidden items-center gap-2 text-sm font-semibold text-primary sm:inline-flex">{isPt ? "Ver tudo" : "View all"}<ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></Link>
          </div>

          {blog.length > 0 ? (
            <div className="overflow-hidden border-y border-border/80 lg:grid lg:grid-cols-[1.35fr_0.65fr]">
              {(() => {
                const featuredPost = blog[0];
                const featuredImage = mediaUrl(featuredPost.coverImage);
                return (
                  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} className="relative min-h-[390px] overflow-hidden lg:min-h-[460px]">
                    <Link to={`/blog/${featuredPost.id}`} className="group absolute inset-0 flex flex-col justify-end p-7 sm:p-10 lg:p-12">
                      {featuredImage && <img src={featuredImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 grayscale-[20%] transition duration-700 group-hover:scale-[1.025] group-hover:opacity-45" />}
                      <div className={`absolute inset-0 ${featuredImage ? "bg-gradient-to-t from-background via-background/90 to-background/20" : "bg-gradient-to-br from-primary/[0.12] via-transparent to-accent/[0.09]"}`} />
                      <div className="tech-grid absolute inset-0 opacity-20" />
                      <span className="absolute right-7 top-5 font-display text-[7rem] font-bold leading-none tracking-[-0.08em] text-primary/[0.07] sm:right-10 sm:text-[9rem]">01</span>
                      <div className="relative max-w-2xl">
                        <div className="mb-6 flex items-center gap-3">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent">{featuredPost.tag}</span>
                          <span className="h-px w-8 bg-border" />
                          <time className="text-xs text-muted-foreground">{featuredPost.date}</time>
                        </div>
                        <h3 className="font-display text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-foreground transition-colors group-hover:text-primary sm:text-4xl lg:text-5xl">{isPt ? featuredPost.titlePt : featuredPost.title}</h3>
                        <p className="mt-5 line-clamp-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{isPt ? featuredPost.excerptPt : featuredPost.excerpt}</p>
                        <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary">{isPt ? "Ler história" : "Read story"}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })()}

              <div className="border-t border-border/80 lg:border-l lg:border-t-0">
                {blog.slice(1, 3).map((post, index) => (
                  <motion.div key={post.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} custom={index + 1} className="border-b border-border/80 last:border-b-0">
                    <Link to={`/blog/${post.id}`} className="group flex min-h-[220px] flex-col justify-between p-7 transition-colors hover:bg-primary/[0.04] sm:p-9 lg:min-h-[230px]">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent">{post.tag}</span>
                        <span className="font-display text-4xl font-bold text-primary/[0.1]">0{index + 2}</span>
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">{isPt ? post.titlePt : post.title}</h3>
                        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground"><time>{post.date}</time><ArrowRight size={17} className="text-primary transition-transform group-hover:translate-x-1" /></div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
                {blog.length < 3 && (
                  <div className="flex min-h-[220px] flex-col justify-between p-7 sm:p-9 lg:min-h-[230px]">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{isPt ? "Próxima pauta" : "Next story"}</span>
                    <p className="max-w-xs font-display text-xl font-semibold leading-tight text-foreground/70">{isPt ? "Mais ciência, pessoas e bastidores estão a caminho." : "More science, people and behind-the-scenes stories are on the way."}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} className="relative overflow-hidden border-y border-border/80 py-10 sm:py-14">
              <div className="tech-grid absolute inset-0 opacity-20" />
              <div className="relative grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-0">
                <div className="px-2 sm:px-8 lg:border-r lg:border-border/80 lg:px-12">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-accent">{isPt ? "Edição inaugural · Em breve" : "Opening issue · Coming soon"}</span>
                      <h3 className="mt-7 max-w-2xl font-display text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-5xl">{isPt ? "Ciência também é feita de histórias." : "Science is also made of stories."}</h3>
                    </div>
                    <span className="hidden font-display text-8xl font-bold leading-none text-primary/[0.08] sm:block"></span>
                  </div>
                  <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{isPt ? "Estamos preparando um espaço para compartilhar descobertas, encontros e o cotidiano de quem transforma pesquisa em impacto." : "We are preparing a space for discoveries, encounters, and the daily work of people turning research into impact."}</p>
                  <Link to="/blog" className="group mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary">{isPt ? "Conhecer o diário" : "Explore the journal"}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
                </div>
                <div className="divide-y divide-border/80 border-t border-border/80 lg:border-t-0">
                  <div className="flex items-center gap-5 px-2 py-7 sm:px-8 lg:px-10"><FlaskConical size={20} className="shrink-0 text-primary" /><div><p className="font-display font-semibold text-foreground">{isPt ? "Projetos & descobertas" : "Projects & discoveries"}</p><p className="mt-1 text-xs text-muted-foreground">{isPt ? "Da pergunta ao resultado." : "From question to result."}</p></div></div>
                  <div className="flex items-center gap-5 px-2 py-7 sm:px-8 lg:px-10"><Users size={20} className="shrink-0 text-accent" /><div><p className="font-display font-semibold text-foreground">{isPt ? "Pessoas & comunidade" : "People & community"}</p><p className="mt-1 text-xs text-muted-foreground">{isPt ? "Os bastidores do laboratório." : "Life behind the lab."}</p></div></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative my-8 flex min-h-[360px] items-center overflow-hidden py-16 sm:my-12 sm:min-h-[400px] sm:py-20"
      >
        <VantaGlobeBackground variant="section" />
        <div className="cta-copy-backdrop pointer-events-none absolute inset-y-0 left-0 z-[1] w-full lg:w-[74%]" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">{isPt ? "Vamos colaborar?" : "Shall we collaborate?"}</p>
              <h2 className="font-display text-4xl font-bold leading-tight tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">{isPt ? "As próximas descobertas começam com uma conversa." : "The next discoveries begin with a conversation."}</h2>
            </div>
            <Link to="/contact" className="group inline-flex shrink-0 items-center gap-3 rounded-xl bg-primary px-6 py-4 text-sm font-bold text-primary-foreground shadow-[0_16px_34px_-18px_hsl(var(--primary))] hover:-translate-y-0.5">
              {t("hero.cta.contact")}
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default HomePage;
