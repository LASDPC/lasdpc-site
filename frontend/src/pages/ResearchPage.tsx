import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FlaskConical } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useProjects } from "@/hooks/useProjects";
import { usePublications } from "@/hooks/usePublications";
import SearchFilterBar from "@/components/SearchFilterBar";
import { Skeleton } from "@/components/ui/skeleton";
import { matchesSearchTerm } from "@/lib/search";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const ResearchPageSkeleton = () => (
  <div className="py-10">
    <div className="container mx-auto px-4">
      <Skeleton className="h-10 w-48 mb-12" />
      <Skeleton className="h-7 w-32 mb-6" />
      <div className="grid md:grid-cols-2 gap-6 mb-20">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border space-y-3">
            <div className="flex gap-2"><Skeleton className="h-5 w-16 rounded" /><Skeleton className="h-5 w-20 rounded" /></div>
            <Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
      <Skeleton className="h-7 w-44 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-5 border border-border space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-2/3" /></div>
        ))}
      </div>
    </div>
  </div>
);

const ResearchPage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: publications = [], isLoading: loadingPubs } = usePublications();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";

  const setSearchQuery = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("q", value);
      else next.delete("q");
      return next;
    }, { replace: true });
  };

  const filteredProjects = useMemo(() => (
    projects.filter((project) => matchesSearchTerm(searchQuery, [
      project.title,
      project.titlePt,
      project.description,
      project.descriptionPt,
      project.content,
      project.contentPt,
      project.status,
      project.impact,
      project.publications,
      ...project.tags,
    ]))
  ), [projects, searchQuery]);

  const filteredPublications = useMemo(() => (
    publications.filter((publication) => matchesSearchTerm(searchQuery, [
      publication.title,
      publication.titlePt,
      publication.authors,
      publication.venue,
      publication.year,
      publication.doi,
    ]))
  ), [publications, searchQuery]);

  if (loadingProjects || loadingPubs) return <ResearchPageSkeleton />;

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-12">
          <FlaskConical className="h-8 w-8 text-primary" />
          <h1 className="font-display text-4xl font-bold text-foreground">{t("section.research")}</h1>
        </div>

        <SearchFilterBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("research.searchPlaceholder")}
          clearLabel={t("research.clearSearch")}
          ariaLabel={t("research.searchPlaceholder")}
        />

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-foreground">{t("section.projects")}</h2>
        </div>
        {filteredProjects.length > 0 ? (
          <div className="grid auto-rows-fr md:grid-cols-2 gap-6 mb-20 items-stretch">
            {filteredProjects.map((p, i) => (
              <div key={p.id} className="relative group h-full">
                <Link to={`/research/${p.id}`} className="block h-full">
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i}
                    className="h-full flex flex-col bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <div className="flex flex-wrap gap-2">
                        {p.tags.map(tag => <span key={tag} className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{tag}</span>)}
                      </div>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${p.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                        {p.status}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2 line-clamp-2 shrink-0">{isPt ? p.titlePt : p.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-4 flex-1 overflow-hidden">{isPt ? p.descriptionPt : p.description}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-auto shrink-0">
                      <span>{p.publications} {isPt ? "publicações" : "publications"}</span>
                      <span>Impact: {p.impact}</span>
                    </div>
                  </motion.div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-20 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            {t("research.noProjectsFound")}
          </p>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-foreground">{t("section.publications")}</h2>
        </div>
        <div className="grid auto-rows-fr gap-4">
          {filteredPublications.map((pub, i) => (
            <div key={pub.id} className="relative group h-full">
              <motion.a href={pub.doi} target="_blank" rel="noopener noreferrer" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="flex h-full min-h-[104px] flex-col justify-center bg-card rounded-lg p-5 border border-border hover:border-primary/50 transition-colors">
                <p className="font-semibold text-foreground line-clamp-2">{isPt ? pub.titlePt : pub.title}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{pub.authors} - <em>{pub.venue}</em>, {pub.year}</p>
              </motion.a>
            </div>
          ))}
        </div>
        {filteredPublications.length === 0 && (
          <p className="mt-4 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            {t("research.noPublicationsFound")}
          </p>
        )}
      </div>
    </div>
  );
};

export default ResearchPage;
