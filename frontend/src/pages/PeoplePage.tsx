import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/contexts/LanguageContext";
import {
  ExternalLink,
  Mail,
  Search,
  Linkedin,
  Github,
  Twitter,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { useDocentes, useStudents } from "@/hooks/usePeople";
import type { User } from "@/services/auth";
import { profileTermsService } from "@/services/profileTerms";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FilterCombobox from "@/components/FilterCombobox";
import DiscoveryFilters from "@/components/DiscoveryFilters";
import EditorialHero from "@/components/EditorialHero";
import { mediaUrl } from "@/lib/media";
import { normalizeResearchArea } from "@/lib/researchAreas";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.025, duration: 0.2, ease: "easeOut" } }),
};

const FORMER_MEMBERS_PAGE_SIZE = 30;
const UNKNOWN_YEAR_BUCKET = -1; // sorts last (handled in code)
const CURRENT_YEAR = new Date().getFullYear();

const PeoplePageSkeleton = () => (
  <div className="py-10">
    <div className="container mx-auto px-4">
      <Skeleton className="h-10 w-48 mb-4" /><Skeleton className="h-4 w-52 mb-12" />
      <div className="grid md:grid-cols-2 gap-6 mb-20">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-start gap-4">
              <Skeleton className="w-16 h-16 rounded-full shrink-0" />
              <div className="flex-1 space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-36" /><Skeleton className="h-4 w-44" /></div>
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-36 mb-8" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 border border-border space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-28" /></div>
        ))}
      </div>
    </div>
  </div>
);

const personAreaValues = (person: User) =>
  [person.area, person.areaPt, ...(person.research_areas ?? [])]
    .map((value) => value?.trim())
    .filter(Boolean) as string[];

const matchesAreaExact = (person: User, area: string) => {
  const target = normalizeResearchArea(area);
  return personAreaValues(person).some((value) => normalizeResearchArea(value) === target);
};

const matchesAreaSearch = (person: User, query: string) => {
  const target = normalizeResearchArea(query);
  if (!target) return true;
  return personAreaValues(person).some((value) => normalizeResearchArea(value).includes(target));
};

const matchesLevel = (student: User, level: string) => {
  const target = normalizeResearchArea(level);
  return [student.level, student.levelPt].some((value) => value && normalizeResearchArea(value) === target);
};

const exitYear = (person: User) => {
  const fromDate = person.exit_date?.match(/^(\d{4})/);
  if (fromDate) return Number(fromDate[1]);
  return person.graduation_year ?? null;
};

const presenceBounds = (person: User) => {
  const start = person.year_joined ?? null;
  const end = exitYear(person);
  if (start === null) {
    if (end === null) return null;
    return { start: end, end };
  }
  const resolvedEnd = person.role === "alumni" && end === null
    ? start
    : Math.max(start, end ?? CURRENT_YEAR);
  return { start, end: resolvedEnd };
};

const wasPresentInYear = (person: User, year: number) => {
  const bounds = presenceBounds(person);
  return Boolean(bounds && year >= bounds.start && year <= bounds.end);
};

const matchesPresenceYear = (person: User, query: string) => {
  const cleanQuery = query.trim();
  if (!cleanQuery) return true;
  if (/^\d{4}$/.test(cleanQuery)) return wasPresentInYear(person, Number(cleanQuery));
  return presenceYearsForPerson(person).some((year) => String(year).includes(cleanQuery));
};

const presenceYearsForPerson = (person: User) => {
  const bounds = presenceBounds(person);
  if (!bounds) return [];
  const years: number[] = [];
  for (let year = bounds.start; year <= bounds.end; year += 1) {
    years.push(year);
  }
  return years;
};

const isFormerMember = (person: User) => person.role === "alumni" || Boolean(exitYear(person));

const exitSortValue = (person: User) => {
  const match = person.exit_date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return Number(`${match[1]}${match[2]}${match[3]}`);
  const year = exitYear(person);
  return year ? year * 10000 + 1231 : Number.NEGATIVE_INFINITY;
};

const formatExitDate = (value?: string | null, isPt = false) => {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, year, month, day] = match;
  return isPt ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
};

function sortByEntryDate(items: User[]) {
  return [...items].sort((a, b) => {
    if (!a.year_joined && !b.year_joined) return a.name.localeCompare(b.name);
    if (!a.year_joined) return 1;
    if (!b.year_joined) return -1;
    return b.year_joined - a.year_joined || a.name.localeCompare(b.name);
  });
}

/** Group former members by exit year, sort years descending, and place unknown
 * dates last. Returns an array of [year, users[]] pairs preserving order.
 */
function groupFormerMembersByExitYear(items: User[]): Array<[number, User[]]> {
  const buckets = new Map<number, User[]>();
  for (const s of items) {
    const y = exitYear(s) ?? UNKNOWN_YEAR_BUCKET;
    if (!buckets.has(y)) buckets.set(y, []);
    buckets.get(y)!.push(s);
  }
  const keys = Array.from(buckets.keys());
  // Sort by year desc; unknown bucket last
  keys.sort((a, b) => {
    if (a === UNKNOWN_YEAR_BUCKET) return 1;
    if (b === UNKNOWN_YEAR_BUCKET) return -1;
    return b - a;
  });
  return keys.map((k) => [
    k,
    buckets.get(k)!.sort((x, y) => exitSortValue(y) - exitSortValue(x) || x.name.localeCompare(y.name)),
  ]);
}

const PeoplePage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const { data: docentes = [], isLoading: loadingDocentes } = useDocentes();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: researchAreaTerms = [] } = useQuery({
    queryKey: ["profile-terms", "research_area", "people-filter"],
    queryFn: () => profileTermsService.list("research_area", "", undefined, 50),
  });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const nameSearch = searchParams.get("name") ?? "";
  const legacyAreaTextFilter = searchParams.get("areaText") ?? "";
  const areaFilter = searchParams.get("area") ?? legacyAreaTextFilter;
  const yearFilter = searchParams.get("year") ?? "";
  const levelFilter = searchParams.get("level") ?? "";
  const formerPage = Math.max(
    1,
    Number(searchParams.get("formerPage") || searchParams.get("alumniPage") || "1") || 1,
  );

  const setFilter = (key: string, value: string, replace = false) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key === "area") next.delete("areaText");
      if (key === "formerPage") next.delete("alumniPage");
      // Any filter change resets the former-member pagination so the user
      // doesn't land on an empty page.
      if (key !== "formerPage") {
        next.delete("formerPage");
        next.delete("alumniPage");
      }
      return next;
    }, { replace });
  };

  const setYearFilter = (value: string, replace = false) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      if (value) {
        next.set("year", value);
      } else {
        next.delete("year");
      }

      next.delete("yearMode");
      next.delete("formerPage");
      next.delete("alumniPage");
      return next;
    }, { replace });
  };

  // Derived filter options
  const areaOptions = useMemo(() => {
    const values = new Map<string, string>();

    const addArea = (value?: string | null) => {
      const clean = value?.trim();
      if (!clean) return;
      const key = normalizeResearchArea(clean);
      if (!values.has(key)) values.set(key, clean);
    };

    researchAreaTerms.forEach((term) => addArea(term.value));
    [...docentes, ...students].forEach((person) => personAreaValues(person).forEach((area) => addArea(area)));

    const areas = Array.from(values.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    return {
      areas,
      knownKeys: new Set(areas.map(normalizeResearchArea)),
    };
  }, [docentes, students, researchAreaTerms]);

  const areaFilterMatchesKnownOption = areaOptions.knownKeys.has(normalizeResearchArea(areaFilter));

  const matchesSelectedArea = useCallback((person: User) => {
    if (!areaFilter) return true;
    return areaFilterMatchesKnownOption
      ? matchesAreaExact(person, areaFilter)
      : matchesAreaSearch(person, areaFilter);
  }, [areaFilter, areaFilterMatchesKnownOption]);

  const presenceYears = useMemo(() => {
    const years = new Set<number>();
    [...docentes, ...students].forEach((person) => {
      presenceYearsForPerson(person).forEach((year) => years.add(year));
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [docentes, students]);

  const hasYearOptions = presenceYears.length > 0;

  const studentLevels = useMemo(() => {
    const levels = new Map<string, string>();
    students.forEach(s => {
      const value = s.level || s.levelPt;
      if (!value) return;
      const label = isPt ? s.levelPt || s.level || value : s.level || s.levelPt || value;
      levels.set(value, label);
    });
    return Array.from(levels.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  }, [students, isPt]);

  const hasAnyFilter = nameSearch || areaFilter || yearFilter || levelFilter || searchParams.has("areaText");

  // Filtered data
  const filteredDocentes = useMemo(() => docentes.filter(d => {
    if (nameSearch && !d.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
    if (!matchesSelectedArea(d)) return false;
    if (!matchesPresenceYear(d, yearFilter)) return false;
    return true;
  }), [docentes, nameSearch, matchesSelectedArea, yearFilter]);

  // Apply free-text / area / year / level filters to every student first.
  const filteredStudents = useMemo(() => students.filter(s => {
    if (nameSearch && !s.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
    if (!matchesSelectedArea(s)) return false;
    if (!matchesPresenceYear(s, yearFilter)) return false;
    if (levelFilter && !matchesLevel(s, levelFilter)) return false;
    return true;
  }), [students, nameSearch, matchesSelectedArea, yearFilter, levelFilter]);

  const currentDocentes = useMemo(
    () => filteredDocentes.filter((d) => !isFormerMember(d)),
    [filteredDocentes],
  );

  // Split by status so the page can render current and former members separately.
  const activeStudents = useMemo(
    () => sortByEntryDate(filteredStudents.filter((s) => s.role === "aluno_ativo" && !isFormerMember(s))),
    [filteredStudents],
  );
  const formerMembers = useMemo(
    () => [
      ...filteredDocentes.filter(isFormerMember),
      ...filteredStudents.filter(isFormerMember),
    ],
    [filteredDocentes, filteredStudents],
  );

  // Group former members by exit year. Pagination paginates over the year
  // groups so each page is a coherent former-member view.
  const formerGroups = useMemo(
    () => groupFormerMembersByExitYear(formerMembers),
    [formerMembers],
  );

  // Pagination across the flat former-member list, preserving the year grouping
  // inside each page.
  const formerPageCount = Math.max(
    1,
    Math.ceil(formerMembers.length / FORMER_MEMBERS_PAGE_SIZE),
  );
  const safeFormerPage = Math.min(formerPage, formerPageCount);

  // If the page param is past the end (because filters shrank the list), pull
  // it back so links stay valid.
  useEffect(() => {
    if (formerPage !== safeFormerPage) {
      setFilter("formerPage", safeFormerPage === 1 ? "" : String(safeFormerPage), true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formerPage, safeFormerPage]);

  const paginatedFormerGroups = useMemo(() => {
    const start = (safeFormerPage - 1) * FORMER_MEMBERS_PAGE_SIZE;
    const end = start + FORMER_MEMBERS_PAGE_SIZE;
    const out: Array<[number, User[]]> = [];
    let offset = 0;
    for (const [year, group] of formerGroups) {
      const groupStart = offset;
      const groupEnd = offset + group.length;
      if (groupEnd > start && groupStart < end) {
        const sliceStart = Math.max(0, start - groupStart);
        const sliceEnd = Math.min(group.length, end - groupStart);
        out.push([year, group.slice(sliceStart, sliceEnd)]);
      }
      offset = groupEnd;
      if (offset >= end) break;
    }
    return out;
  }, [formerGroups, safeFormerPage]);

  const goToPage = (n: number) => {
    const clamped = Math.min(Math.max(1, n), formerPageCount);
    setFilter("formerPage", clamped === 1 ? "" : String(clamped));
    // Scroll former-member heading back into view
    requestAnimationFrame(() => {
      document
        .getElementById("former-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const clearFilters = () => setSearchParams({});

  if (loadingDocentes || loadingStudents) return <PeoplePageSkeleton />;

  const yearLabel = (y: number) =>
    y === UNKNOWN_YEAR_BUCKET
      ? isPt
        ? "Data de saída não informada"
        : "Exit date unknown"
      : isPt
        ? `Saída em ${y}`
        : `Left in ${y}`;

  return (
    <div>
      <EditorialHero
        eyebrow={isPt ? "Comunidade · LaSDPC" : "Community · LaSDPC"}
        title={<>{isPt ? "Pessoas que" : "People who"}<br /><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{isPt ? "fazem acontecer." : "make it happen."}</span></>}
        description={isPt ? "A pesquisa ganha vida quando diferentes trajetórias se encontram. Conheça quem transforma perguntas em descobertas no laboratório." : "Research comes to life when different paths meet. Meet the people turning questions into discoveries at the lab."}
        action={isPt ? "Conhecer a equipe" : "Meet the team"}
        target="#faculty-section"
        visual={
          <div className="relative mx-auto h-[320px] w-full max-w-[530px] lg:h-[430px]">
            <div className="absolute inset-[7%] rounded-full border border-primary/25" />
            <div className="absolute inset-[21%] rounded-full border border-dashed border-accent/35" />
            <div className="absolute inset-[35%] rounded-full bg-primary/10 blur-3xl" />
            <span className="absolute left-[8%] top-[11%] h-2 w-2 rounded-full bg-accent shadow-[0_0_18px_hsl(var(--accent))]" />
            <span className="absolute bottom-[10%] right-[18%] h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary))]" />
            {(currentDocentes.concat(activeStudents).slice(0, 4)).map((person, index) => {
              const positions = ["left-[29%] top-[5%]", "right-[5%] top-[25%]", "bottom-[3%] left-[26%]", "bottom-[27%] left-[1%]"];
              return (
                <div key={person.id} className={`absolute ${positions[index]} h-20 w-20 overflow-hidden rounded-[1.5rem] border-4 border-background bg-primary/10 shadow-xl shadow-primary/10 md:h-28 md:w-28`} title={person.name}>
                  {person.photo ? <img src={mediaUrl(person.photo)} alt={person.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-primary">{person.initials || person.name.slice(0, 2)}</div>}
                </div>
              );
            })}
            <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2rem] border border-primary/20 bg-card/90 text-primary shadow-2xl shadow-primary/15 backdrop-blur md:h-32 md:w-32"><Users className="h-11 w-11 md:h-14 md:w-14" strokeWidth={1.25} /></div>
          </div>
        }
        footer={<div className="flex flex-wrap gap-x-10 gap-y-3 text-sm text-muted-foreground"><span><strong className="mr-2 font-display text-2xl text-foreground">{currentDocentes.length}</strong>{isPt ? "docentes" : "faculty"}</span><span><strong className="mr-2 font-display text-2xl text-foreground">{activeStudents.length}</strong>{isPt ? "estudantes" : "students"}</span><span><strong className="mr-2 font-display text-2xl text-foreground">{formerMembers.length}</strong>{isPt ? "ex-integrantes" : "alumni"}</span></div>}
      />
      <div className="container mx-auto px-4 py-14 md:py-20">

        {/* Filter bar */}
        <DiscoveryFilters
          icon={Users}
          eyebrow={isPt ? "Encontre sua conexão" : "Find your connection"}
          title={isPt ? "Explore a comunidade" : "Explore the community"}
          count={currentDocentes.length + activeStudents.length + formerMembers.length}
          countLabel={isPt ? "pessoas" : "people"}
          hint={isPt ? "Busque por nome, área, ano ou nível" : "Search by name, area, year or level"}
          clearLabel={t("people.clearFilters")}
          active={Boolean(hasAnyFilter)}
          onClear={clearFilters}
        >
            <div className="min-w-[230px] flex-[1.4]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={nameSearch}
                  onChange={(e) => setFilter("name", e.target.value, true)}
                  placeholder={t("people.searchPlaceholder")}
                  aria-label={t("people.searchPlaceholder")}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            {areaOptions.areas.length > 0 && (
              <FilterCombobox
                value={areaFilter}
                options={areaOptions.areas}
                onChange={(value, replace) => setFilter("area", value, replace)}
                className="min-w-[170px]"
                labels={{
                  placeholder: t("people.areaSearchPlaceholder"),
                  clear: t("people.clearAreaFilter"),
                  noResults: t("people.noAreaResults"),
                }}
              />
            )}
            {hasYearOptions && (
              <FilterCombobox
                value={yearFilter}
                options={presenceYears.map(String)}
                onChange={setYearFilter}
                inputMode="numeric"
                className="min-w-[135px]"
                labels={{
                  placeholder: t("people.filterByYear"),
                  clear: t("people.clearYearFilter"),
                  noResults: t("people.noYearResults"),
                }}
              />
            )}
            {studentLevels.length > 0 && (
              <select
                value={levelFilter}
                onChange={(e) => setFilter("level", e.target.value)}
                className="h-12 min-w-[140px] flex-1 rounded-xl border border-border bg-background/75 px-3 text-sm text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <option value="">{t("people.filterByLevel")}</option>
                {studentLevels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            )}
        </DiscoveryFilters>

        {/* Faculty section */}
        <div id="faculty-section" className="mb-8 flex items-end justify-between scroll-mt-24 border-b border-border pb-5">
          <div><p className="mb-2 font-mono text-xs font-bold uppercase tracking-[.2em] text-primary">01 / {isPt ? "Orientação" : "Mentorship"}</p><h2 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">{t("section.faculty")}</h2></div>
          <span className="font-mono text-sm text-muted-foreground">{String(currentDocentes.length).padStart(2, "0")}</span>
        </div>

        {currentDocentes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 mb-20">{t("people.noResults")}</p>
        ) : (
          <div className="grid auto-rows-fr md:grid-cols-2 gap-5 mb-20">
            {currentDocentes.map((d, i) => (
              <div key={d.id} className="relative group h-full">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="h-full bg-card/80 rounded-[1.5rem] p-6 border border-border hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => navigate(`/profile/${d.id}`)}
                  onKeyDown={(event) => { if (event.key === "Enter") navigate(`/profile/${d.id}`); }}
                  tabIndex={0}
                  role="link"
                >
                  <div className="flex items-start gap-4">
                    {d.photo ? (
                      <img
                        src={mediaUrl(d.photo)}
                        alt={d.name}
                        className="w-20 h-20 rounded-2xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-xl shrink-0">
                        {d.initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-xl font-semibold text-foreground line-clamp-2">{d.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{isPt ? d.titlePt : d.title}</p>
                      <p className="text-sm text-accent mt-1 line-clamp-1">{isPt ? d.areaPt : d.area}</p>
                      <div className="flex flex-wrap gap-3 mt-3 text-xs max-h-10 overflow-hidden">
                        <a href={`mailto:${d.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><Mail size={12} /> Email</a>
                        {d.lattes && <a href={d.lattes} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><ExternalLink size={12} /> Lattes</a>}
                        {d.orcid && <a href={d.orcid} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><ExternalLink size={12} /> ORCID</a>}
                        {d.scholar && <a href={d.scholar} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><ExternalLink size={12} /> Scholar</a>}
                        {d.linkedin && <a href={d.linkedin} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><Linkedin size={12} /> LinkedIn</a>}
                        {d.github && <a href={d.github} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><Github size={12} /> GitHub</a>}
                        {d.twitter && <a href={d.twitter} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><Twitter size={12} /> X</a>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        )}

        {/* Active Students section */}
        <div className="flex items-end justify-between mb-4 border-b border-border pb-5">
          <div><p className="mb-2 font-mono text-xs font-bold uppercase tracking-[.2em] text-primary">02 / {isPt ? "Nova geração" : "Next generation"}</p>
          <h2 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {t("section.activeStudents")}
          </h2></div><span className="font-mono text-sm text-muted-foreground">{String(activeStudents.length).padStart(2, "0")}</span>
        </div>
        <p className="text-muted-foreground mb-8 text-sm font-mono">
          {t("section.activeStudents.desc")}
        </p>

        {activeStudents.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 mb-20">
            {t("people.noResults")}
          </p>
        ) : (
          <div className="grid auto-rows-fr sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
            {activeStudents.map((s, i) => (
              <PersonCard
                key={s.id}
                person={s}
                index={i}
                isPt={isPt}
                onClick={() => navigate(`/profile/${s.id}`)}
              />
            ))}
          </div>
        )}

        {/* Former members section */}
        <div id="former-section" className="flex items-end justify-between mb-4 scroll-mt-24 border-b border-border pb-5">
          <div><p className="mb-2 font-mono text-xs font-bold uppercase tracking-[.2em] text-primary">03 / {isPt ? "Trajetórias" : "Journeys"}</p>
          <h2 className="font-display text-4xl font-bold tracking-tight text-foreground flex items-center gap-2 md:text-5xl">
            {t("section.alumni")}
          </h2></div><span className="font-mono text-sm text-muted-foreground">{String(formerMembers.length).padStart(2, "0")}</span>
        </div>
        <p className="text-muted-foreground mb-8 text-sm font-mono">
          {t("section.alumni.desc")}
        </p>

        {formerMembers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t("people.noResults")}</p>
        ) : (
          <>
            <div className="space-y-10">
              {paginatedFormerGroups.map(([year, group]) => (
                <div key={year}>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {yearLabel(year)}
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground">
                      ({group.length})
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid auto-rows-fr sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.map((s, i) => (
                      <PersonCard
                        key={s.id}
                        person={s}
                        index={i}
                        isPt={isPt}
                        onClick={() => navigate(`/profile/${s.id}`)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {formerPageCount > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(safeFormerPage - 1)}
                  disabled={safeFormerPage === 1}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  {t("people.prev")}
                </Button>

                {Array.from({ length: formerPageCount }).map((_, idx) => {
                  const p = idx + 1;
                  // Show first, last, current and neighbours; collapse the rest
                  const isEdge = p === 1 || p === formerPageCount;
                  const isNear = Math.abs(p - safeFormerPage) <= 1;
                  if (!isEdge && !isNear) {
                    // Render a single ellipsis between groups
                    if (p === 2 || p === formerPageCount - 1) {
                      return (
                        <span
                          key={`ellipsis-${p}`}
                          className="text-muted-foreground px-2 select-none"
                        >
                          …
                        </span>
                      );
                    }
                    return null;
                  }
                  return (
                    <Button
                      key={p}
                      variant={p === safeFormerPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(p)}
                      className="min-w-[36px]"
                    >
                      {p}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(safeFormerPage + 1)}
                  disabled={safeFormerPage === formerPageCount}
                >
                  {t("people.next")}
                  <ChevronRight size={16} className="ml-1" />
                </Button>

                <span className="text-xs font-mono text-muted-foreground ml-3">
                  {t("people.pageOf")
                    .replace("{current}", String(safeFormerPage))
                    .replace("{total}", String(formerPageCount))}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface PersonCardProps {
  person: User;
  index: number;
  isPt: boolean;
  onClick: () => void;
}

const PersonCard = ({ person, index: i, isPt, onClick }: PersonCardProps) => {
  const subtitle = person.role === "docente"
    ? (isPt ? person.titlePt || person.title : person.title || person.titlePt) || (isPt ? "Docente" : "Faculty")
    : (isPt ? person.levelPt || person.level : person.level || person.levelPt);
  const area = isPt ? person.areaPt || person.area : person.area || person.areaPt;
  const exitLabel = person.exit_date
    ? (isPt ? `Saiu em ${formatExitDate(person.exit_date, true)}` : `Left ${formatExitDate(person.exit_date)}`)
    : null;

  return (
    <div className="relative group h-full">
      <motion.button
        type="button"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={i}
        className="h-full w-full min-h-[190px] rounded-[1.3rem] border border-border bg-card/75 p-5 text-left cursor-pointer hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300 flex flex-col overflow-hidden"
        onClick={onClick}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          {person.photo ? <img src={mediaUrl(person.photo)} alt="" className="h-12 w-12 rounded-xl object-cover" loading="lazy" /> : <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-display font-bold text-primary">{person.initials || person.name.slice(0, 2)}</span>}
          <ArrowUpRight size={18} className="text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        <p className="font-display text-lg font-semibold text-foreground line-clamp-2">{person.name}</p>
        {subtitle && <p className="text-sm text-accent line-clamp-1">{subtitle}</p>}
        {area && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{area}</p>}
        {person.year_joined && (
          <p className="text-xs text-muted-foreground mt-1 shrink-0">
            {isPt ? `Desde ${person.year_joined}` : `Since ${person.year_joined}`}
          </p>
        )}
        {exitLabel && (
          <p className="text-xs text-muted-foreground mt-0.5 shrink-0">{exitLabel}</p>
        )}
        {!exitLabel && person.graduation_year && person.role === "alumni" && (
          <p className="text-xs text-muted-foreground mt-0.5 shrink-0">
            {isPt ? `Formado em ${person.graduation_year}` : `Graduated ${person.graduation_year}`}
          </p>
        )}
        {person.research_areas && person.research_areas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-2 max-h-12 overflow-hidden">
            {person.research_areas.slice(0, 2).map((a) => (
              <span
                key={a}
                className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full"
              >
                {a}
              </span>
            ))}
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default PeoplePage;
