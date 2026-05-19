import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FlaskConical, Search, X, ChevronDown, Check } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useProjects } from "@/hooks/useProjects";
import { usePublications } from "@/hooks/usePublications";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { matchesSearchTerm, normalizeSearchText } from "@/lib/search";

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

// ---------------------------------------------------------------------------
// Tag combobox (search + select), mirroring the AreaFilterCombobox on PeoplePage
// ---------------------------------------------------------------------------

interface TagComboboxProps {
  value: string;
  tags: string[];
  onChange: (value: string, replace?: boolean) => void;
  labels: { placeholder: string; clear: string; noResults: string };
}

const TagCombobox = ({ value, tags, onChange, labels }: TagComboboxProps) => {
  const [open, setOpen] = useState(false);
  const normalizedQuery = normalizeSearchText(value).trim();
  const filtered = normalizedQuery
    ? tags.filter((t) => normalizeSearchText(t).includes(normalizedQuery))
    : tags;

  const select = (tag: string) => {
    onChange(tag);
    setOpen(false);
  };

  return (
    <div
      className="relative min-w-[220px] flex-1 sm:flex-none"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value, true);
            setOpen(true);
          }}
          placeholder={labels.placeholder}
          className="pl-9 pr-20"
        />
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onChange("", true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label={labels.clear}
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setOpen((current) => !current)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={labels.placeholder}
          >
            <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-80 overflow-auto rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg">
          {filtered.length > 0 ? (
            <div className="space-y-1">
              {filtered.map((tag) => {
                const selected = normalizeSearchText(tag) === normalizeSearchText(value);
                return (
                  <button
                    key={tag}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(tag)}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="min-w-0 truncate">{tag}</span>
                    {selected && <Check size={14} className="shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-2 py-2 text-xs text-muted-foreground">{labels.noResults}</p>
          )}
        </div>
      )}
    </div>
  );
};

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
  const statusFilter = searchParams.get("status") ?? "";
  const typeFilter = searchParams.get("type") ?? "";
  const impactFilter = searchParams.get("impact") ?? "";

  const setFilter = useCallback(
    (key: string, value: string, replace = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
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

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.status && set.add(p.status));
    publications.forEach((p) => p.status && set.add(p.status));
    return Array.from(set);
  }, [projects, publications]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    publications.forEach((p) => p.type && set.add(p.type));
    return Array.from(set);
  }, [publications]);

  const impactOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.impact && set.add(p.impact));
    publications.forEach((p) => p.impact && set.add(p.impact));
    return Array.from(set);
  }, [projects, publications]);

  const hasAnyFilter =
    Boolean(searchQuery) ||
    Boolean(yearFilter) ||
    Boolean(tagFilter) ||
    Boolean(statusFilter) ||
    Boolean(typeFilter) ||
    Boolean(impactFilter);

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
        if (statusFilter && project.status !== statusFilter) return false;
        if (impactFilter && project.impact !== impactFilter) return false;
        if (typeFilter) return false; // type is a publication-only facet
        if (!tagMatches(project.tags)) return false;
        return true;
      }),
    [projects, searchQuery, yearFilter, statusFilter, impactFilter, typeFilter, tagMatches],
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
        if (yearFilter && String(publication.year) !== yearFilter) return false;
        if (statusFilter && publication.status !== statusFilter) return false;
        if (typeFilter && publication.type !== typeFilter) return false;
        if (impactFilter && publication.impact !== impactFilter) return false;
        if (!tagMatches([...(publication.tags ?? []), publication.area, publication.areaPt])) return false;
        return true;
      }),
    [publications, searchQuery, yearFilter, statusFilter, typeFilter, impactFilter, tagMatches],
  );

  if (loadingProjects || loadingPubs) return <ResearchPageSkeleton />;

  // ---- Localised labels for known status/type/impact values ----
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

  const impactLabel = (value: string) => {
    const map: Record<string, [string, string]> = {
      High: ["High", "Alto"],
      Medium: ["Medium", "Médio"],
      Low: ["Low", "Baixo"],
    };
    const pair = map[value];
    if (!pair) return value;
    return isPt ? pair[1] : pair[0];
  };

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-12">
          <FlaskConical className="h-8 w-8 text-primary" />
          <h1 className="font-display text-4xl font-bold text-foreground">{t("section.research")}</h1>
        </div>

        {/* Faceted filter bar (mirrors PeoplePage) */}
        <div className="mb-10 bg-card border border-border rounded-xl p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setFilter("q", event.target.value, true)}
                  placeholder={t("research.searchPlaceholder")}
                  aria-label={t("research.searchPlaceholder")}
                  className="pl-9 pr-9"
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
              <TagCombobox
                value={tagFilter}
                tags={tagOptions}
                onChange={(value, replace) => setFilter("tag", value, replace)}
                labels={{
                  placeholder: t("research.filterByTag"),
                  clear: t("research.clearTagFilter"),
                  noResults: t("research.noTagResults"),
                }}
              />
            )}

            {yearOptions.length > 0 && (
              <select
                value={yearFilter}
                onChange={(event) => setFilter("year", event.target.value)}
                className="bg-secondary border border-border rounded-md px-3 py-2 text-sm min-w-[140px]"
              >
                <option value="">{t("research.filterByYear")}</option>
                {yearOptions.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            )}

            {statusOptions.length > 0 && (
              <select
                value={statusFilter}
                onChange={(event) => setFilter("status", event.target.value)}
                className="bg-secondary border border-border rounded-md px-3 py-2 text-sm min-w-[140px]"
              >
                <option value="">{t("research.filterByStatus")}</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
            )}

            {typeOptions.length > 0 && (
              <select
                value={typeFilter}
                onChange={(event) => setFilter("type", event.target.value)}
                className="bg-secondary border border-border rounded-md px-3 py-2 text-sm min-w-[140px]"
              >
                <option value="">{t("research.filterByType")}</option>
                {typeOptions.map((tp) => (
                  <option key={tp} value={tp}>{typeLabel(tp)}</option>
                ))}
              </select>
            )}

            {impactOptions.length > 0 && (
              <select
                value={impactFilter}
                onChange={(event) => setFilter("impact", event.target.value)}
                className="bg-secondary border border-border rounded-md px-3 py-2 text-sm min-w-[140px]"
              >
                <option value="">{t("research.filterByImpact")}</option>
                {impactOptions.map((i) => (
                  <option key={i} value={i}>{impactLabel(i)}</option>
                ))}
              </select>
            )}

            {hasAnyFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X size={14} className="mr-1" /> {t("research.clearFilters")}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-foreground">
            {t("section.projects")}
            <span className="ml-2 text-sm font-mono text-muted-foreground align-middle">
              ({filteredProjects.length})
            </span>
          </h2>
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
                        {p.tags.map((tag) => (
                          <span key={tag} className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{tag}</span>
                        ))}
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
          <h2 className="font-display text-2xl font-bold text-foreground">
            {t("section.publications")}
            <span className="ml-2 text-sm font-mono text-muted-foreground align-middle">
              ({filteredPublications.length})
            </span>
          </h2>
        </div>
        <div className="grid auto-rows-fr gap-4">
          {filteredPublications.map((pub, i) => (
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
                className="flex h-full min-h-[104px] flex-col justify-center bg-card rounded-lg p-5 border border-border hover:border-primary/50 transition-colors"
              >
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
      </div>
    </div>
  );
};

export default ResearchPage;
