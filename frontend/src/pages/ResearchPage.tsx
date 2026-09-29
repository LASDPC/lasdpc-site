import { useCallback, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, BookOpenText, FlaskConical, Network, Search, X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useProjects } from "@/hooks/useProjects";
import { usePublications } from "@/hooks/usePublications";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import FilterCombobox from "@/components/FilterCombobox";
import DiscoveryFilters from "@/components/DiscoveryFilters";
import PaginationControls from "@/components/PaginationControls";
import EditorialHero from "@/components/EditorialHero";
import { matchesSearchTerm, normalizeSearchText } from "@/lib/search";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.025, duration: 0.2, ease: "easeOut" } }),
};

const PROJECTS_PAGE_SIZE = 6;
const PUBLICATIONS_PAGE_SIZE = 10;

const matchesPublicationYear = (year: number, query: string) => {
  const cleanQuery = query.trim();
  if (!cleanQuery) return true;
  const yearText = String(year);
  return /^\d{4}$/.test(cleanQuery) ? yearText === cleanQuery : yearText.includes(cleanQuery);
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

  // ---- URL-bound filter state ----
  const searchQuery = searchParams.get("q") ?? "";
  const yearFilter = searchParams.get("year") ?? "";
  const tagFilter = searchParams.get("tag") ?? "";
  const typeFilter = searchParams.get("type") ?? "";
  const projectsPage = Math.max(1, Number(searchParams.get("projectsPage") || "1") || 1);
  const pubsPage = Math.max(1, Number(searchParams.get("pubsPage") || "1") || 1);

  const setFilter = useCallback(
    (key: string, value: string, replace = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          // Any filter change (other than pagination params themselves) resets
          // both page params so users don't land on an empty page.
          if (key !== "projectsPage" && key !== "pubsPage") {
            next.delete("projectsPage");
            next.delete("pubsPage");
          }
          return next;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  const clearFilters = () => setSearchParams({});

  // ---- Derived filter option sets ----
  const tagOptions = useMemo(() => {
    const set = new Map<string, string>();
    const add = (tag?: string | null) => {
      const clean = tag?.trim();
      if (!clean) return;
      const key = normalizeSearchText(clean);
      if (!set.has(key)) set.set(key, clean);
    };
    projects.forEach((p) => p.tags?.forEach(add));
    publications.forEach((p) => p.tags?.forEach(add));
    publications.forEach((p) => {
      add(p.area ?? undefined);
      add(p.areaPt ?? undefined);
    });
    return Array.from(set.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [projects, publications]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    publications.forEach((p) => {
      if (typeof p.year === "number" && p.year > 0) years.add(p.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [publications]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    publications.forEach((p) => p.type && set.add(p.type));
    return Array.from(set);
  }, [publications]);

  const hasAnyFilter =
    Boolean(searchQuery) ||
    Boolean(yearFilter) ||
    Boolean(tagFilter) ||
    Boolean(typeFilter);

  // ---- Filtering ----
  const tagMatches = useCallback(
    (values: Array<string | null | undefined>) => {
      if (!tagFilter) return true;
      const target = normalizeSearchText(tagFilter);
      return values.some((v) => v && normalizeSearchText(v).includes(target));
    },
    [tagFilter],
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        if (
          !matchesSearchTerm(searchQuery, [
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
          ])
        ) {
          return false;
        }
        // Year filter doesn't apply to projects - keep them when set so the
        // page still shows context, but hide them when *another* filter
        // narrowed publications to a specific year only? -> we keep projects
        // visible only when no year is set, otherwise focus on publications.
        if (yearFilter) return false;
        if (typeFilter) return false; // type is a publication-only facet
        if (!tagMatches(project.tags)) return false;
        return true;
      }),
    [projects, searchQuery, yearFilter, typeFilter, tagMatches],
  );

  const filteredPublications = useMemo(
    () =>
      publications.filter((publication) => {
        if (
          !matchesSearchTerm(searchQuery, [
            publication.title,
            publication.titlePt,
            publication.authors,
            publication.venue,
            publication.year,
            publication.doi,
            publication.area,
            publication.areaPt,
            ...(publication.tags ?? []),
          ])
        ) {
          return false;
        }
        if (!matchesPublicationYear(publication.year, yearFilter)) return false;
        if (typeFilter && publication.type !== typeFilter) return false;
        if (!tagMatches([...(publication.tags ?? []), publication.area, publication.areaPt])) return false;
        return true;
      }),
    [publications, searchQuery, yearFilter, typeFilter, tagMatches],
  );

  // ---- Pagination (mirrors PeoplePage) ----
  const projectsPageCount = Math.max(1, Math.ceil(filteredProjects.length / PROJECTS_PAGE_SIZE));
  const safeProjectsPage = Math.min(projectsPage, projectsPageCount);
  const pubsPageCount = Math.max(1, Math.ceil(filteredPublications.length / PUBLICATIONS_PAGE_SIZE));
  const safePubsPage = Math.min(pubsPage, pubsPageCount);

  // If the URL page param is past the end (because filters shrank the list),
  // clamp it back so links stay valid.
  useEffect(() => {
    if (projectsPage !== safeProjectsPage) {
      setFilter("projectsPage", safeProjectsPage === 1 ? "" : String(safeProjectsPage), true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectsPage, safeProjectsPage]);

  useEffect(() => {
    if (pubsPage !== safePubsPage) {
      setFilter("pubsPage", safePubsPage === 1 ? "" : String(safePubsPage), true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubsPage, safePubsPage]);

  const paginatedProjects = useMemo(() => {
    const start = (safeProjectsPage - 1) * PROJECTS_PAGE_SIZE;
    return filteredProjects.slice(start, start + PROJECTS_PAGE_SIZE);
  }, [filteredProjects, safeProjectsPage]);

  const paginatedPublications = useMemo(() => {
    const start = (safePubsPage - 1) * PUBLICATIONS_PAGE_SIZE;
    return filteredPublications.slice(start, start + PUBLICATIONS_PAGE_SIZE);
  }, [filteredPublications, safePubsPage]);

  const goToProjectsPage = (n: number) => {
    const clamped = Math.min(Math.max(1, n), projectsPageCount);
    setFilter("projectsPage", clamped === 1 ? "" : String(clamped));
    requestAnimationFrame(() => {
      document
        .getElementById("research-projects-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const goToPubsPage = (n: number) => {
    const clamped = Math.min(Math.max(1, n), pubsPageCount);
    setFilter("pubsPage", clamped === 1 ? "" : String(clamped));
    requestAnimationFrame(() => {
      document
        .getElementById("research-publications-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (loadingProjects || loadingPubs) return <ResearchPageSkeleton />;

  // ---- Localised labels for known status/type values (status still shown on cards) ----
  const statusLabel = (value: string) => {
    const map: Record<string, [string, string]> = {
      active: ["Active", "Ativo"],
      completed: ["Completed", "Concluído"],
      published: ["Published", "Publicado"],
      preprint: ["Preprint", "Preprint"],
      "under-review": ["Under review", "Em revisão"],
      "in-press": ["In press", "No prelo"],
    };
    const pair = map[value];
    if (!pair) return value;
    return isPt ? pair[1] : pair[0];
  };

  const typeLabel = (value: string) => {
    const map: Record<string, [string, string]> = {
      article: ["Article", "Artigo"],
      conference: ["Conference", "Conferência"],
      journal: ["Journal", "Periódico"],
      book: ["Book", "Livro"],
      chapter: ["Chapter", "Capítulo"],
      thesis: ["Thesis", "Tese/Dissertação"],
      preprint: ["Preprint", "Preprint"],
      other: ["Other", "Outro"],
    };
    const pair = map[value];
    if (!pair) return value;
    return isPt ? pair[1] : pair[0];
  };

  return (
    <div>
      <EditorialHero
        eyebrow={isPt ? "Pesquisa · LaSDPC" : "Research · LaSDPC"}
        title={<>{isPt ? "Ideias que" : "Ideas that"}<br /><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{isPt ? "ganham escala." : "scale beyond."}</span></>}
        description={isPt ? "Da pergunta ao experimento, do experimento ao impacto. Explore os projetos e resultados que conectam computação, ciência e sociedade." : "From question to experiment, from experiment to impact. Explore projects and results connecting computing, science and society."}
        action={isPt ? "Explorar projetos" : "Explore projects"}
        target="#research-projects-section"
        visual={<div className="relative mx-auto flex h-[320px] max-w-[520px] items-center justify-center lg:h-[420px]">
          <div className="absolute h-[300px] w-[300px] rounded-full border border-primary/25 md:h-[390px] md:w-[390px]" />
          <div className="absolute h-[210px] w-[210px] rounded-full border border-dashed border-accent/40 md:h-[285px] md:w-[285px]" />
          <div className="absolute h-[90px] w-[90px] rounded-full bg-primary/15 blur-3xl" />
          <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-primary/25 bg-card/90 text-primary shadow-2xl shadow-primary/15 backdrop-blur"><FlaskConical size={53} strokeWidth={1.2} /></div>
          <div className="absolute left-[5%] top-[12%] flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-lg"><Network size={24} /></div>
          <div className="absolute bottom-[11%] right-[6%] flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-accent shadow-lg"><BookOpenText size={24} /></div>
          <span className="absolute right-[10%] top-[15%] h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_18px_hsl(var(--accent))]" />
          <span className="absolute bottom-[16%] left-[13%] h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary))]" />
        </div>}
        footer={<div className="flex flex-wrap gap-x-10 gap-y-3 text-sm text-muted-foreground"><span><strong className="mr-2 font-display text-2xl text-foreground">{projects.length}</strong>{isPt ? "projetos" : "projects"}</span><span><strong className="mr-2 font-display text-2xl text-foreground">{publications.length}</strong>{isPt ? "publicações" : "publications"}</span></div>}
      />
      <div className="container mx-auto px-4 py-14 md:py-20">
        {/* Faceted filter bar (mirrors PeoplePage) */}
        <DiscoveryFilters
          icon={FlaskConical}
          eyebrow={isPt ? "Da ideia ao resultado" : "From idea to result"}
          title={isPt ? "Descubra a pesquisa" : "Discover our research"}
          count={filteredProjects.length + filteredPublications.length}
          countLabel={isPt ? "resultados" : "results"}
          hint={isPt ? "Filtre projetos e publicações por assunto, ano ou tipo" : "Filter projects and publications by topic, year or type"}
          clearLabel={t("research.clearFilters")}
          active={hasAnyFilter}
          onClear={clearFilters}
        >
            <div className="min-w-[230px] flex-[1.4]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setFilter("q", event.target.value, true)}
                  placeholder={t("research.searchPlaceholder")}
                  aria-label={t("research.searchPlaceholder")}
                  className="pl-10 pr-9 text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setFilter("q", "", true)}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label={t("research.clearSearch")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {tagOptions.length > 0 && (
              <FilterCombobox
                value={tagFilter}
                options={tagOptions}
                onChange={(value, replace) => setFilter("tag", value, replace)}
                labels={{
                  placeholder: t("research.filterByTag"),
                  clear: t("research.clearTagFilter"),
                  noResults: t("research.noTagResults"),
                }}
              />
            )}

            {yearOptions.length > 0 && (
              <FilterCombobox
                value={yearFilter}
                options={yearOptions.map(String)}
                onChange={(value, replace) => setFilter("year", value, replace)}
                inputMode="numeric"
                className="min-w-[125px]"
                labels={{
                  placeholder: t("research.filterByYear"),
                  clear: t("research.clearYearFilter"),
                  noResults: t("research.noYearResults"),
                }}
              />
            )}

            {typeOptions.length > 0 && (
              <select
                value={typeFilter}
                onChange={(event) => setFilter("type", event.target.value)}
                className="h-12 min-w-[140px] flex-1 rounded-xl border border-border bg-background/75 px-3 text-sm text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <option value="">{t("research.filterByType")}</option>
                {typeOptions.map((tp) => (
                  <option key={tp} value={tp}>{typeLabel(tp)}</option>
                ))}
              </select>
            )}

        </DiscoveryFilters>

        <div
          id="research-projects-section"
          className="flex items-end justify-between mb-8 scroll-mt-24 border-b border-border pb-5"
        >
          <div><p className="mb-2 font-mono text-xs font-bold uppercase tracking-[.2em] text-primary">01 / {isPt ? "Em desenvolvimento" : "In progress"}</p><h2 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {t("section.projects")}
          </h2></div><span className="font-mono text-sm text-muted-foreground">{String(filteredProjects.length).padStart(2, "0")}</span>
        </div>
        {filteredProjects.length > 0 ? (
          <div className="grid auto-rows-fr md:grid-cols-2 gap-5 items-stretch">
            {paginatedProjects.map((p, i) => (
              <div key={p.id} className="relative group h-full">
                <Link to={`/research/${p.id}`} className="block h-full">
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i}
                    className="h-full min-h-[260px] flex flex-col rounded-[1.5rem] border border-border bg-card/80 p-7 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-xl group-hover:shadow-primary/10 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4 mb-8 shrink-0">
                      <div className="flex flex-wrap gap-2">
                        {p.tags.map((tag) => (
                          <span key={tag} className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                      <ArrowUpRight size={22} className="shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground mb-3 line-clamp-2 shrink-0">{isPt ? p.titlePt : p.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-4 flex-1 overflow-hidden">{isPt ? p.descriptionPt : p.description}</p>
                    <div className="flex flex-wrap gap-4 border-t border-border pt-4 text-xs text-muted-foreground mt-auto shrink-0">
                      <span className={p.status === "active" ? "text-accent" : ""}>● {statusLabel(p.status)}</span>
                      <span>{p.publications} {isPt ? "publicações" : "publications"}</span>
                      {p.impact && <span>{isPt ? "Impacto" : "Impact"}: {p.impact}</span>}
                    </div>
                  </motion.div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            {t("research.noProjectsFound")}
          </p>
        )}

        <PaginationControls
          page={safeProjectsPage}
          pageCount={projectsPageCount}
          onChange={goToProjectsPage}
          labels={{
            prev: t("people.prev"),
            next: t("people.next"),
            pageOf: t("people.pageOf"),
          }}
        />

        <div
          id="research-publications-section"
          className="flex items-end justify-between mb-8 mt-20 scroll-mt-24 border-b border-border pb-5"
        >
          <div><p className="mb-2 font-mono text-xs font-bold uppercase tracking-[.2em] text-primary">02 / {isPt ? "Conhecimento aberto" : "Open knowledge"}</p><h2 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {t("section.publications")}
          </h2></div><span className="font-mono text-sm text-muted-foreground">{String(filteredPublications.length).padStart(2, "0")}</span>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {paginatedPublications.map((pub, i) => (
            <div key={pub.id} className="relative group h-full">
              <motion.a
                href={pub.doi}
                target="_blank"
                rel="noopener noreferrer"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="group flex h-full min-h-[120px] flex-col justify-center py-5 px-2 transition-all duration-300 hover:bg-primary/5 md:px-5"
              >
                <div className="flex items-center justify-between gap-5"><span className="font-mono text-xs font-bold text-primary">{pub.year}</span><ArrowUpRight size={18} className="text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" /></div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {pub.type && (
                    <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {typeLabel(pub.type)}
                    </span>
                  )}
                  {pub.status && pub.status !== "published" && (
                    <span className="text-[10px] font-mono uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      {statusLabel(pub.status)}
                    </span>
                  )}
                  {pub.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono bg-accent/10 text-accent px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="font-semibold text-foreground line-clamp-2">{isPt ? pub.titlePt || pub.title : pub.title || pub.titlePt}</p>
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

        <PaginationControls
          page={safePubsPage}
          pageCount={pubsPageCount}
          onChange={goToPubsPage}
          labels={{
            prev: t("people.prev"),
            next: t("people.next"),
            pageOf: t("people.pageOf"),
          }}
        />
      </div>
    </div>
  );
};

export default ResearchPage;
