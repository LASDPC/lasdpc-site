import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { ArrowRight, Cpu, Users, BookOpen } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { usePublications } from "@/hooks/usePublications";
import { useBlog } from "@/hooks/useBlog";
import { useStats } from "@/hooks/useStats";
import { Skeleton } from "@/components/ui/skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const timelineKeys = ["1998", "2005", "2012", "2018", "2023"] as const;

const blogImages = [
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=340&fit=crop",
  "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=600&h=340&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=340&fit=crop",
];

const HomePageSkeleton = () => (
  <div>
    {/* Hero skeleton */}
    <section className="min-h-[75vh] flex items-center bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl space-y-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-14 w-full max-w-xl" />
          <Skeleton className="h-14 w-3/4 max-w-lg" />
          <Skeleton className="h-6 w-full max-w-2xl" />
          <Skeleton className="h-6 w-2/3 max-w-lg" />
          <div className="flex gap-4 pt-2">
            <Skeleton className="h-12 w-40 rounded-lg" />
            <Skeleton className="h-12 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </section>

    {/* Stats skeleton */}
    <section className="py-16 bg-card border-b border-border">
      <div className="container mx-auto px-4 grid grid-cols-3 gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </section>

    {/* Timeline skeleton */}
    <section className="py-20">
      <div className="container mx-auto px-4">
        <Skeleton className="h-9 w-48 mb-4" />
        <Skeleton className="h-5 w-full max-w-2xl mb-16" />
        <div className="space-y-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <Skeleton className="h-20 w-full md:w-1/2 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Research skeleton */}
    <section className="py-20 bg-card border-y border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-[220px] flex flex-col bg-background rounded-xl p-6 border border-border gap-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Publications skeleton */}
    <section className="py-20">
      <div className="container mx-auto px-4">
        <Skeleton className="h-9 w-56 mb-10" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-5 border border-border space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Blog skeleton */}
    <section className="py-20 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col bg-background rounded-xl border border-border overflow-hidden">
              <Skeleton className="w-full h-44 rounded-none" />
              <div className="p-6 flex flex-col gap-3">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-3 w-20 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

const HomePage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: publications = [], isLoading: loadingPubs } = usePublications();
  const { data: blog = [], isLoading: loadingBlog } = useBlog();
  const { data: stats, isLoading: loadingStats } = useStats();

  if (loadingProjects || loadingPubs || loadingBlog || loadingStats) return <HomePageSkeleton />;

  return (
    <div>
      {/* Hero */}
      <section className="min-h-[75vh] flex items-center bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" animate="visible" className="max-w-3xl">
            <motion.p variants={fadeUp} custom={0} className="text-primary font-mono text-sm font-medium tracking-widest uppercase mb-4">
              LASDPC - ICMC-USP
            </motion.p>
            <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              {t("hero.title")}
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg sm:text-xl leading-relaxed mb-8 max-w-2xl">
              {t("hero.subtitle")}
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
              <Link to="/research" className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                {t("hero.cta.explore")} <ArrowRight size={18} />
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-colors">
                {t("hero.cta.contact")}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-card border-b border-border">
        <div className="container mx-auto px-4 grid grid-cols-3 gap-8">
          {[
            { icon: <Users size={28} />, value: String(stats?.researchers ?? 0), label: isPt ? "Pesquisadores" : "Researchers" },
            { icon: <BookOpen size={28} />, value: String(stats?.publications ?? 0), label: isPt ? "Publicações" : "Publications" },
            { icon: <Cpu size={28} />, value: String(stats?.clusters ?? 0), label: "Clusters HPC" },
          ].map((s, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-3">{s.icon}</div>
              <p className="font-display text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About / Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">{t("section.about")}</h2>
          <p className="text-muted-foreground max-w-2xl mb-16">{t("section.about.desc")}</p>

          {/* Centered alternating timeline */}
          <div className="relative">
            {/* Center line */}
            <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-primary/20" />

            <div className="space-y-12">
              {timelineKeys.map((year, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <motion.div
                    key={year}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                    className="relative flex items-start md:items-center"
                  >
                    {/* Dot */}
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background z-10" />

                    {/* Content card - mobile always right, desktop alternates */}
                    <div className={`ml-10 md:ml-0 md:w-1/2 ${isLeft ? "md:pr-12 md:text-right" : "md:pl-12 md:ml-auto"}`}>
                      <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
                        <span className="font-mono text-sm text-accent font-semibold">{year}</span>
                        <p className="text-foreground mt-1.5 text-sm">{t(`timeline.${year}`)}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Research Preview */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-3xl font-bold text-foreground">{t("section.research")}</h2>
            <Link to="/research" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
              {isPt ? "Ver tudo" : "View all"} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {projects.slice(0, 2).map((p, i) => (
              <Link to={`/research/${p.id}`} key={p.id} className="h-full">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="h-[220px] flex flex-col bg-background rounded-xl p-6 border border-border hover:border-primary/40 transition-colors cursor-pointer overflow-hidden">
                  <div className="flex flex-wrap gap-2 mb-3 shrink-0 overflow-hidden max-h-[28px]">
                    {p.tags.map(tag => <span key={tag} className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{tag}</span>)}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2 line-clamp-2 shrink-0">{isPt ? p.titlePt : p.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1 overflow-hidden">{isPt ? p.descriptionPt : p.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Publications */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground mb-10">{t("section.publications")}</h2>
          <div className="space-y-4">
            {publications.slice(0, 3).map((pub, i) => (
              <motion.a key={pub.id} href={pub.doi} target="_blank" rel="noopener noreferrer" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="block bg-card rounded-lg p-5 border border-border hover:border-primary/50 transition-colors">
                <p className="font-semibold text-foreground">{isPt ? pub.titlePt : pub.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{pub.authors} - <em>{pub.venue}</em>, {pub.year}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-20 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-3xl font-bold text-foreground">{t("section.blog")}</h2>
            <Link to="/blog" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
              {isPt ? "Ver tudo" : "View all"} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {blog.map((post, i) => (
              <Link to={`/blog/${post.id}`} key={post.id} className="h-full">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="flex flex-col h-full bg-background rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-colors cursor-pointer">
                  <img
                    src={blogImages[i % blogImages.length]}
                    alt={isPt ? post.titlePt : post.title}
                    className="w-full h-44 object-cover shrink-0"
                    loading="lazy"
                  />
                  <div className="p-6 flex flex-col flex-1">
                    <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded self-start shrink-0">{post.tag}</span>
                    <h3 className="font-display text-lg font-semibold text-foreground mt-3 mb-2 line-clamp-2 shrink-0">{isPt ? post.titlePt : post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1 overflow-hidden">{isPt ? post.excerptPt : post.excerpt}</p>
                    <p className="text-xs text-muted-foreground mt-3 shrink-0">{post.date}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
