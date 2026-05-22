import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChevronDown, Newspaper, Search, X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useBlog } from "@/hooks/useBlog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PaginationControls from "@/components/PaginationControls";
import PageHeader from "@/components/PageHeader";
import { mediaUrl } from "@/lib/media";
import { matchesSearchTerm, normalizeSearchText } from "@/lib/search";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=340&fit=crop";

const BLOG_PAGE_SIZE = 9;

const BlogPageSkeleton = () => (
  <div className="py-10">
    <div className="container mx-auto px-4">
      <Skeleton className="h-10 w-32 mb-4" /><Skeleton className="h-4 w-48 mb-2" /><Skeleton className="h-4 w-96 mb-12" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col bg-card rounded-xl border border-border overflow-hidden">
            <Skeleton className="w-full h-44 rounded-none" />
            <div className="p-6 flex flex-col gap-3"><Skeleton className="h-5 w-16 rounded" /><Skeleton className="h-6 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-3 w-24 mt-2" /></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Tag combobox (search + select), mirroring the TagCombobox on ResearchPage
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

// Extract a 4-digit year from a free-text date string ("March 15, 2025",
// "2025-03-15", "15/03/2025", etc). Returns null when no year can be found.
const extractYear = (value?: string | null): number | null => {
  if (!value) return null;
  const match = value.match(/(19|20)\d{2}/);
  if (!match) return null;
  const year = Number(match[0]);
  return Number.isFinite(year) ? year : null;
};

const BlogPage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const { data: blog = [], isLoading } = useBlog();
  const [searchParams, setSearchParams] = useSearchParams();

  // ---- URL-bound filter state ----
  const searchQuery = searchParams.get("q") ?? "";
  const tagFilter = searchParams.get("tag") ?? "";
  const yearFilter = searchParams.get("year") ?? "";
  const authorFilter = searchParams.get("author") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);

  const setFilter = useCallback(
    (key: string, value: string, replace = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          // Any filter change (other than the page param itself) resets
          // pagination so the user doesn't land on an empty page.
          if (key !== "page") next.delete("page");
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
    blog.forEach((post) => {
      const clean = post.tag?.trim();
      if (!clean) return;
      const key = normalizeSearchText(clean);
      if (!set.has(key)) set.set(key, clean);
    });
    return Array.from(set.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [blog]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    blog.forEach((post) => {
      const y = extractYear(post.date);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [blog]);

  const authorOptions = useMemo(() => {
    const set = new Map<string, string>();
    blog.forEach((post) => {
      const clean = post.author?.trim();
      if (!clean) return;
      const key = normalizeSearchText(clean);
      if (!set.has(key)) set.set(key, clean);
    });
    return Array.from(set.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [blog]);

  const hasAnyFilter =
    Boolean(searchQuery) || Boolean(tagFilter) || Boolean(yearFilter) || Boolean(authorFilter);

  // ---- Filtering ----
  const tagMatches = useCallback(
    (tag?: string | null) => {
      if (!tagFilter) return true;
      const target = normalizeSearchText(tagFilter);
      return Boolean(tag && normalizeSearchText(tag).includes(target));
    },
    [tagFilter],
  );

  const filteredBlog = useMemo(
    () =>
      blog.filter((post) => {
        if (
          !matchesSearchTerm(searchQuery, [
            post.title,
            post.titlePt,
            post.excerpt,
            post.excerptPt,
            post.content,
            post.contentPt,
            post.tag,
            post.author,
            post.date,
          ])
        ) {
          return false;
        }
        if (!tagMatches(post.tag)) return false;
        if (yearFilter && String(extractYear(post.date) ?? "") !== yearFilter) return false;
        if (authorFilter && post.author !== authorFilter) return false;
        return true;
      }),
    [blog, searchQuery, tagMatches, yearFilter, authorFilter],
  );

  // ---- Pagination ----
  const pageCount = Math.max(1, Math.ceil(filteredBlog.length / BLOG_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    if (page !== safePage) {
      setFilter("page", safePage === 1 ? "" : String(safePage), true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, safePage]);

  const paginatedBlog = useMemo(() => {
    const start = (safePage - 1) * BLOG_PAGE_SIZE;
    return filteredBlog.slice(start, start + BLOG_PAGE_SIZE);
  }, [filteredBlog, safePage]);

  const goToPage = (n: number) => {
    const clamped = Math.min(Math.max(1, n), pageCount);
    setFilter("page", clamped === 1 ? "" : String(clamped));
    requestAnimationFrame(() => {
      document
        .getElementById("blog-posts-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (isLoading) return <BlogPageSkeleton />;

  return (
    <div>
      <PageHeader
        icon={Newspaper}
        title={t("section.blog")}
        subtitle={
          <span className="italic text-sm">
            {isPt
              ? "Nota: futura integração com LinkedIn/Instagram para publicação automática."
              : "Note: future LinkedIn/Instagram integration for auto-publishing."}
          </span>
        }
      />
      <div className="container mx-auto px-4 py-10">
        {/* Faceted filter bar (mirrors ResearchPage) */}
        <div className="mb-10 bg-card border border-border rounded-xl p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setFilter("q", event.target.value, true)}
                  placeholder={t("blog.searchPlaceholder")}
                  aria-label={t("blog.searchPlaceholder")}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setFilter("q", "", true)}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label={t("blog.clearSearch")}
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
                  placeholder: t("blog.filterByTag"),
                  clear: t("blog.clearTagFilter"),
                  noResults: t("blog.noTagResults"),
                }}
              />
            )}

            {yearOptions.length > 0 && (
              <select
                value={yearFilter}
                onChange={(event) => setFilter("year", event.target.value)}
                className="bg-secondary border border-border rounded-md px-3 py-2 text-sm min-w-[140px]"
              >
                <option value="">{t("blog.filterByYear")}</option>
                {yearOptions.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            )}

            {authorOptions.length > 0 && (
              <select
                value={authorFilter}
                onChange={(event) => setFilter("author", event.target.value)}
                className="bg-secondary border border-border rounded-md px-3 py-2 text-sm min-w-[160px]"
              >
                <option value="">{t("blog.filterByAuthor")}</option>
                {authorOptions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            )}

            {hasAnyFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X size={14} className="mr-1" /> {t("blog.clearFilters")}
              </Button>
            )}
          </div>
        </div>

        <div
          id="blog-posts-section"
          className="flex items-center justify-between mb-6 scroll-mt-20"
        >
          <h2 className="font-display text-2xl font-bold text-foreground">
            {t("section.blog")}
            <span className="ml-2 text-sm font-mono text-muted-foreground align-middle">
              ({filteredBlog.length})
            </span>
          </h2>
        </div>

        {paginatedBlog.length > 0 ? (
          <div className="grid auto-rows-fr md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBlog.map((post, i) => (
              <div key={post.id} className="relative group h-full">
                <Link to={`/blog/${post.id}`} className="block h-full">
                  <motion.article initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="flex flex-col h-full bg-card rounded-xl border border-border hover:border-primary/30 transition-colors overflow-hidden cursor-pointer">
                    <img
                      src={mediaUrl(post.coverImage) || FALLBACK_IMAGE}
                      alt={isPt ? post.titlePt : post.title}
                      className="w-full h-44 object-cover shrink-0"
                      loading="lazy"
                    />
                    <div className="p-6 flex flex-col flex-1">
                      <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded self-start shrink-0">{post.tag}</span>
                      <h2 className="font-display text-xl font-semibold text-foreground mt-4 mb-3 line-clamp-2 shrink-0">{isPt ? post.titlePt : post.title}</h2>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1 overflow-hidden">{isPt ? post.excerptPt : post.excerpt}</p>
                      <time className="text-xs text-muted-foreground shrink-0">{post.date}</time>
                    </div>
                  </motion.article>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            {t("blog.noPostsFound")}
          </p>
        )}

        <PaginationControls
          page={safePage}
          pageCount={pageCount}
          onChange={goToPage}
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

export default BlogPage;
