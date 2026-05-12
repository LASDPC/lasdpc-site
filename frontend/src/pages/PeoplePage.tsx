import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import {
  ExternalLink,
  Mail,
  Search,
  X,
  Linkedin,
  Github,
  Twitter,
  Users,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useDocentes, useStudents } from "@/hooks/usePeople";
import type { User } from "@/services/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { mediaUrl } from "@/lib/media";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const ALUMNI_PAGE_SIZE = 30;
const UNKNOWN_YEAR_BUCKET = -1; // sorts last (handled in code)

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

/** Group alumni by year_joined, sort years descending, and place "unknown
 * year" last. Returns an array of [year, students[]] pairs preserving order.
 */
function groupAlumniByYear(items: User[]): Array<[number, User[]]> {
  const buckets = new Map<number, User[]>();
  for (const s of items) {
    const y = s.year_joined ?? UNKNOWN_YEAR_BUCKET;
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
  return keys.map((k) => [k, buckets.get(k)!.sort((x, y) => x.name.localeCompare(y.name))]);
}

const PeoplePage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const { data: docentes = [], isLoading: loadingDocentes } = useDocentes();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const nameSearch = searchParams.get("name") ?? "";
  const areaFilter = searchParams.get("area") ?? "";
  const yearFilter = searchParams.get("year") ?? "";
  const levelFilter = searchParams.get("level") ?? "";
  const alumniPage = Math.max(1, Number(searchParams.get("alumniPage") || "1") || 1);

  const setFilter = (key: string, value: string, replace = false) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      // Any filter change resets the alumni pagination so the user doesn't
      // land on an empty page.
      if (key !== "alumniPage") next.delete("alumniPage");
      return next;
    }, { replace });
  };

  // Derived filter options
  const allAreas = useMemo(() => {
    const areas = new Set<string>();
    [...docentes, ...students].forEach(p => {
      p.research_areas?.forEach(a => areas.add(a));
      if (p.area) areas.add(p.area);
      if (p.areaPt) areas.add(p.areaPt);
    });
    return Array.from(areas).sort();
  }, [docentes, students]);

  const allYears = useMemo(() => {
    const years = new Set<number>();
    [...docentes, ...students].forEach(p => {
      if (p.year_joined) years.add(p.year_joined);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [docentes, students]);

  const studentLevels = useMemo(() => {
    const levels = new Set<string>();
    students.forEach(s => {
      if (s.level) levels.add(s.level);
    });
    return Array.from(levels).sort();
  }, [students]);

  const hasAnyFilter = nameSearch || areaFilter || yearFilter || levelFilter;

  // Filtered data
  const filteredDocentes = useMemo(() => docentes.filter(d => {
    if (nameSearch && !d.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
    if (areaFilter && !d.research_areas?.includes(areaFilter) && d.area !== areaFilter && d.areaPt !== areaFilter) return false;
    if (yearFilter && d.year_joined !== Number(yearFilter)) return false;
    return true;
  }), [docentes, nameSearch, areaFilter, yearFilter]);

  // Apply free-text / area / year / level filters to every student first.
  const filteredStudents = useMemo(() => students.filter(s => {
    if (nameSearch && !s.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
    if (areaFilter && !s.research_areas?.includes(areaFilter) && s.area !== areaFilter && s.areaPt !== areaFilter) return false;
    if (yearFilter && s.year_joined !== Number(yearFilter)) return false;
    if (levelFilter && s.level !== levelFilter) return false;
    return true;
  }), [students, nameSearch, areaFilter, yearFilter, levelFilter]);

  // Split by role so the page can render Active and Alumni separately.
  const activeStudents = useMemo(
    () => filteredStudents.filter((s) => s.role === "aluno_ativo"),
    [filteredStudents],
  );
  const alumniStudents = useMemo(
    () => filteredStudents.filter((s) => s.role === "alumni"),
    [filteredStudents],
  );

  // Group alumni by year of entry (year_joined). Pagination paginates over
  // the year groups so each page is a coherent "class of YYYY" view.
  const alumniGroups = useMemo(
    () => groupAlumniByYear(alumniStudents),
    [alumniStudents],
  );

  // Pagination across the flat alumni list, preserving the year grouping
  // inside each page.
  const alumniPageCount = Math.max(
    1,
    Math.ceil(alumniStudents.length / ALUMNI_PAGE_SIZE),
  );
  const safeAlumniPage = Math.min(alumniPage, alumniPageCount);

  // If the page param is past the end (because filters shrank the list), pull
  // it back so links stay valid.
  useEffect(() => {
    if (alumniPage !== safeAlumniPage) {
      setFilter("alumniPage", String(safeAlumniPage), true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumniPage, safeAlumniPage]);

  const paginatedAlumniGroups = useMemo(() => {
    const start = (safeAlumniPage - 1) * ALUMNI_PAGE_SIZE;
    const end = start + ALUMNI_PAGE_SIZE;
    const out: Array<[number, User[]]> = [];
    let offset = 0;
    for (const [year, group] of alumniGroups) {
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
  }, [alumniGroups, safeAlumniPage]);

  const goToPage = (n: number) => {
    const clamped = Math.min(Math.max(1, n), alumniPageCount);
    setFilter("alumniPage", clamped === 1 ? "" : String(clamped));
    // Scroll alumni heading back into view
    requestAnimationFrame(() => {
      document
        .getElementById("alumni-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const clearFilters = () => setSearchParams({});

  if (loadingDocentes || loadingStudents) return <PeoplePageSkeleton />;

  const yearLabel = (y: number) =>
    y === UNKNOWN_YEAR_BUCKET
      ? isPt
        ? "Ano não informado"
        : "Year unknown"
      : isPt
        ? `Ingressantes em ${y}`
        : `Joined in ${y}`;

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">

        {/* Page title */}
        <div className="flex items-center gap-3 mb-12">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="font-display text-4xl font-bold text-foreground">{t("nav.people")}</h1>
        </div>

        {/* Filter bar */}
        <div className="mb-10 bg-card border border-border rounded-xl p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={nameSearch}
                  onChange={(e) => setFilter("name", e.target.value, true)}
                  placeholder={t("people.searchPlaceholder")}
                  className="pl-9"
                />
              </div>
            </div>
            {allAreas.length > 0 && (
              <select
                value={areaFilter}
                onChange={(e) => setFilter("area", e.target.value)}
                className="bg-secondary border border-border rounded-md px-3 py-2 text-sm min-w-[160px]"
              >
                <option value="">{t("people.filterByArea")}</option>
                {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
            {allYears.length > 0 && (
              <select
                value={yearFilter}
                onChange={(e) => setFilter("year", e.target.value)}
                className="bg-secondary border border-border rounded-md px-3 py-2 text-sm min-w-[140px]"
              >
                <option value="">{t("people.filterByYear")}</option>
                {allYears.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            )}
            {studentLevels.length > 0 && (
              <select
                value={levelFilter}
                onChange={(e) => setFilter("level", e.target.value)}
                className="bg-secondary border border-border rounded-md px-3 py-2 text-sm min-w-[140px]"
              >
                <option value="">{t("people.filterByLevel")}</option>
                {studentLevels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            )}
            {hasAnyFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X size={14} className="mr-1" /> {t("people.clearFilters")}
              </Button>
            )}
          </div>
        </div>

        {/* Faculty section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-3xl font-bold text-foreground">{t("section.faculty")}</h2>
        </div>

        {filteredDocentes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 mb-20">{t("people.noResults")}</p>
        ) : (
          <div className="grid auto-rows-fr md:grid-cols-2 gap-6 mb-20">
            {filteredDocentes.map((d, i) => (
              <div key={d.id} className="relative group h-full">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="h-full bg-card rounded-xl p-6 border border-border hover:glow-primary transition-shadow cursor-pointer"
                  onClick={() => navigate(`/profile/${d.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {d.photo ? (
                      <img
                        src={mediaUrl(d.photo)}
                        alt={d.name}
                        className="w-16 h-16 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-xl shrink-0">
                        {d.initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2">{d.name}</h3>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-3xl font-bold text-foreground">
            {t("section.activeStudents")}
            <span className="ml-2 text-sm font-mono text-muted-foreground align-middle">
              ({activeStudents.length})
            </span>
          </h2>
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
              <StudentCard
                key={s.id}
                student={s}
                index={i}
                isPt={isPt}
                onClick={() => navigate(`/profile/${s.id}`)}
              />
            ))}
          </div>
        )}

        {/* Alumni section */}
        <div
          id="alumni-section"
          className="flex items-center justify-between mb-4 scroll-mt-20"
        >
          <h2 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
            {t("section.alumni")}
            <span className="text-sm font-mono text-muted-foreground align-middle">
              ({alumniStudents.length})
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={t("people.alumniInfoAria")}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-primary hover:bg-primary/10 transition-colors"
                >
                  <Info size={18} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm leading-relaxed">
                <p className="font-semibold text-foreground mb-2">
                  {isPt ? "O que é Alumni USP?" : "What is Alumni USP?"}
                </p>
                <p className="text-muted-foreground">{t("people.alumniInfo")}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  {isPt ? "Saiba mais:" : "Learn more:"}{" "}
                  <a
                    href="https://www5.usp.br/alumni-usp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    alumni-usp
                  </a>
                  {", "}
                  <a
                    href="https://alumni.usp.br/plataforma-alumni-usp-completa-3-anos/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    plataforma
                  </a>
                </p>
              </PopoverContent>
            </Popover>
          </h2>
        </div>
        <p className="text-muted-foreground mb-8 text-sm font-mono">
          {t("section.alumni.desc")}
        </p>

        {alumniStudents.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t("people.noResults")}</p>
        ) : (
          <>
            <div className="space-y-10">
              {paginatedAlumniGroups.map(([year, group]) => (
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
                      <StudentCard
                        key={s.id}
                        student={s}
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
            {alumniPageCount > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(safeAlumniPage - 1)}
                  disabled={safeAlumniPage === 1}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  {t("people.prev")}
                </Button>

                {Array.from({ length: alumniPageCount }).map((_, idx) => {
                  const p = idx + 1;
                  // Show first, last, current and neighbours; collapse the rest
                  const isEdge = p === 1 || p === alumniPageCount;
                  const isNear = Math.abs(p - safeAlumniPage) <= 1;
                  if (!isEdge && !isNear) {
                    // Render a single ellipsis between groups
                    if (p === 2 || p === alumniPageCount - 1) {
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
                      variant={p === safeAlumniPage ? "default" : "outline"}
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
                  onClick={() => goToPage(safeAlumniPage + 1)}
                  disabled={safeAlumniPage === alumniPageCount}
                >
                  {t("people.next")}
                  <ChevronRight size={16} className="ml-1" />
                </Button>

                <span className="text-xs font-mono text-muted-foreground ml-3">
                  {t("people.pageOf")
                    .replace("{current}", String(safeAlumniPage))
                    .replace("{total}", String(alumniPageCount))}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface StudentCardProps {
  student: User;
  index: number;
  isPt: boolean;
  onClick: () => void;
}

const StudentCard = ({ student: s, index: i, isPt, onClick }: StudentCardProps) => (
  <div className="relative group h-full">
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={i}
      className="h-full min-h-[154px] bg-card rounded-lg p-4 border border-border cursor-pointer hover:bg-accent/5 transition-colors flex flex-col overflow-hidden"
      onClick={onClick}
    >
      <p className="font-semibold text-foreground line-clamp-2">{s.name}</p>
      <p className="text-sm text-accent line-clamp-1">{isPt ? s.levelPt : s.level}</p>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{isPt ? s.areaPt : s.area}</p>
      {s.year_joined && (
        <p className="text-xs text-muted-foreground mt-1 shrink-0">
          {isPt ? `Desde ${s.year_joined}` : `Since ${s.year_joined}`}
        </p>
      )}
      {s.graduation_year && s.role === "alumni" && (
        <p className="text-xs text-muted-foreground mt-0.5 shrink-0">
          {isPt ? `Formado em ${s.graduation_year}` : `Graduated ${s.graduation_year}`}
        </p>
      )}
      {s.research_areas && s.research_areas.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto pt-2 max-h-12 overflow-hidden">
          {s.research_areas.slice(0, 2).map((a) => (
            <span
              key={a}
              className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full"
            >
              {a}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  </div>
);

export default PeoplePage;
