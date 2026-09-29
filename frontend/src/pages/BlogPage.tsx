import { useCallback, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Newspaper, Search, X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useBlog } from "@/hooks/useBlog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FilterCombobox from "@/components/FilterCombobox";
import DiscoveryFilters from "@/components/DiscoveryFilters";
import PaginationControls from "@/components/PaginationControls";
import EditorialHero from "@/components/EditorialHero";
import { mediaUrl } from "@/lib/media";
import { matchesSearchTerm, normalizeSearchText } from "@/lib/search";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.025, duration: 0.2, ease: "easeOut" } }),
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

// Extract a 4-digit year from a free-text date string ("March 15, 2025",
// "2025-03-15", "15/03/2025", etc). Returns null when no year can be found.
const extractYear = (value?: string | null): number | null => {
  if (!value) return null;
  const match = value.match(/(19|20)\d{2}/);
  if (!match) return null;
  const year = Number(match[0]);
  return Number.isFinite(year) ? year : null;
};

const matchesYearFilter = (date: string, query: string) => {
  const cleanQuery = query.trim();
  if (!cleanQuery) return true;
  const year = extractYear(date);
  if (!year) return false;
  const yearText = String(year);
  return /^\d{4}$/.test(cleanQuery) ? yearText === cleanQuery : yearText.includes(cleanQuery);
};

const matchesTextFilter = (value: string | null | undefined, query: string) => {
  const target = normalizeSearchText(query).trim();
  if (!target) return true;
  return Boolean(value && normalizeSearchText(value).includes(target));
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
  const categoryFilter = searchParams.get("category") ?? "";
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

  const categoryOptions = useMemo(() => {
    const set = new Map<string, string>();
    blog.forEach((post) => {
      const clean = post.category?.trim();
      if (!clean) return;
      const key = normalizeSearchText(clean);
      if (!set.has(key)) set.set(key, clean);
    });
    return Array.from(set.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [blog]);

  const hasAnyFilter =
    Boolean(searchQuery) || Boolean(tagFilter) || Boolean(yearFilter) || Boolean(authorFilter) || Boolean(categoryFilter);

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
            post.category,
          ])
        ) {
          return false;
        }
        if (!matchesTextFilter(post.tag, tagFilter)) return false;
        if (!matchesYearFilter(post.date, yearFilter)) return false;
        if (!matchesTextFilter(post.author, authorFilter)) return false;
        if (categoryFilter && !matchesTextFilter(post.category, categoryFilter)) return false;
        return true;
      }),
    [blog, searchQuery, tagFilter, yearFilter, authorFilter, categoryFilter],
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
      <EditorialHero
        eyebrow={isPt ? "Diário do laboratório" : "From the lab"}
        title={<>{isPt ? "Além da" : "Beyond the"}<br /><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{isPt ? "pesquisa." : "research."}</span></>}
        description={isPt ? "Ideias, encontros e bastidores de quem faz ciência todos os dias. Um espaço para contar o que acontece entre uma descoberta e outra." : "Ideas, encounters and stories from the people doing science every day. A space for what happens between discoveries."}
        action={isPt ? "Ler histórias" : "Read stories"}
        target="#blog-posts-section"
        visual={<div className="relative mx-auto flex h-[320px] max-w-[510px] items-center justify-center lg:h-[410px]">
          <div className="absolute left-[10%] top-[11%] h-[72%] w-[70%] -rotate-12 rounded-[2rem] border border-primary/20 bg-primary/10" />
          <div className="absolute right-[8%] top-[16%] h-[72%] w-[70%] rotate-9 rounded-[2rem] border border-accent/25 bg-accent/10" />
          <div className="relative z-10 flex h-[75%] w-[72%] flex-col justify-between overflow-hidden rounded-[2rem] border border-border bg-card p-7 shadow-2xl shadow-primary/10 md:p-10">
            <div className="flex items-center justify-between border-b border-border pb-4"><span className="font-mono text-xs font-bold uppercase tracking-[.2em] text-primary">LaSDPC / {isPt ? "Histórias" : "Stories"}</span><Newspaper size={22} className="text-primary" /></div>
            <div><span className="mb-3 block font-mono text-xs font-bold uppercase tracking-[.2em] text-accent">{isPt ? "Ideias em movimento" : "Ideas in motion"}</span><p className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">{isPt ? "A ciência também tem histórias para contar." : "Science has stories to tell, too."}</p></div>
            <span className="block h-1 w-16 rounded-full bg-gradient-to-r from-primary to-accent" />
          </div>
        </div>}
        footer={<div className="flex flex-wrap gap-x-10 gap-y-3 text-sm text-muted-foreground"><span><strong className="mr-2 font-display text-2xl text-foreground">{blog.length}</strong>{isPt ? "histórias publicadas" : "published stories"}</span><span className="font-mono text-xs font-bold uppercase tracking-[.18em] text-primary"></span></div>}
      />
      <div className="container mx-auto px-4 py-14 md:py-20">
        {/* Faceted filter bar (mirrors ResearchPage) */}
        <DiscoveryFilters
          icon={Newspaper}
          eyebrow={isPt ? "Arquivo vivo" : "Living archive"}
          title={isPt ? "Encontre uma história" : "Find a story"}
          count={filteredBlog.length}
          countLabel={isPt ? "histórias" : "stories"}
          hint={isPt ? "Explore por tema, ano, autoria ou categoria" : "Explore by topic, year, author or category"}
          clearLabel={t("blog.clearFilters")}
          active={hasAnyFilter}
          onClear={clearFilters}
        >
            <div className="min-w-[230px] flex-[1.5]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setFilter("q", event.target.value, true)}
                  placeholder={t("blog.searchPlaceholder")}
                  aria-label={t("blog.searchPlaceholder")}
                  className="pl-10 pr-9 text-sm"
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
              <FilterCombobox
                value={tagFilter}
                options={tagOptions}
                onChange={(value, replace) => setFilter("tag", value, replace)}
                labels={{
                  placeholder: t("blog.filterByTag"),
                  clear: t("blog.clearTagFilter"),
                  noResults: t("blog.noTagResults"),
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
                  placeholder: t("blog.filterByYear"),
                  clear: t("blog.clearYearFilter"),
                  noResults: t("blog.noYearResults"),
                }}
              />
            )}

            {authorOptions.length > 0 && (
              <FilterCombobox
                value={authorFilter}
                options={authorOptions}
                onChange={(value, replace) => setFilter("author", value, replace)}
                className="min-w-[150px]"
                labels={{
                  placeholder: t("blog.filterByAuthor"),
                  clear: t("blog.clearAuthorFilter"),
                  noResults: t("blog.noAuthorResults"),
                }}
              />
            )}

            {categoryOptions.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(event) => setFilter("category", event.target.value)}
                className="h-12 min-w-[140px] flex-1 rounded-xl border border-border bg-background/75 px-3 text-sm text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <option value="">{t("blog.filterByCategory")}</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

        </DiscoveryFilters>

        <div
          id="blog-posts-section"
          className="flex items-end justify-between mb-8 scroll-mt-24 border-b border-border pb-5"
        >
          <div><p className="mb-2 font-mono text-xs font-bold uppercase tracking-[.2em] text-primary">{isPt ? "O que há de novo" : "Latest from the lab"}</p><h2 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {t("section.blog")}
          </h2></div><span className="font-mono text-sm text-muted-foreground">{String(filteredBlog.length).padStart(2, "0")}</span>
        </div>

        {paginatedBlog.length > 0 ? (
          <div className="grid auto-rows-fr md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedBlog.map((post, i) => (
              <div key={post.id} className={`relative group h-full ${i === 0 && safePage === 1 && !hasAnyFilter ? "lg:col-span-2" : ""}`}>
                <Link to={`/blog/${post.id}`} className="block h-full">
                  <motion.article initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className={`flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card/80 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-xl group-hover:shadow-primary/10 cursor-pointer ${i === 0 && safePage === 1 && !hasAnyFilter ? "lg:grid lg:grid-cols-2" : ""}`}>
                    <div className="overflow-hidden"><img
                      src={mediaUrl(post.coverImage) || FALLBACK_IMAGE}
                      alt={isPt ? post.titlePt : post.title}
                      className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${i === 0 && safePage === 1 && !hasAnyFilter ? "h-52 lg:h-full lg:min-h-[340px]" : "h-52"}`}
                      loading="lazy"
                    /></div>
                    <div className="p-6 md:p-7 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-3"><span className="text-xs font-mono font-bold uppercase tracking-[.12em] text-accent">{post.tag || post.category || (isPt ? "História" : "Story")}</span><ArrowUpRight size={20} className="shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" /></div>
                      <h2 className={`font-display font-semibold tracking-tight text-foreground mt-6 mb-3 line-clamp-3 shrink-0 ${i === 0 && safePage === 1 && !hasAnyFilter ? "text-2xl md:text-3xl" : "text-xl"}`}>{isPt ? post.titlePt || post.title : post.title || post.titlePt}</h2>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1 overflow-hidden">{isPt ? post.excerptPt : post.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground"><time>{post.date}</time>{post.author && <span>· {post.author}</span>}</div>
                    </div>
                  </motion.article>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card/75 px-7 py-12 md:px-12 md:py-16">
            <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-primary/20" />
            <div className="pointer-events-none absolute right-16 top-12 h-40 w-40 rounded-full border border-dashed border-accent/25" />
            <div className="relative max-w-xl">
              <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Newspaper size={27} strokeWidth={1.5} /></span>
              <p className="font-mono text-xs font-bold uppercase tracking-[.2em] text-accent">{hasAnyFilter ? (isPt ? "Nenhum resultado" : "No results") : (isPt ? "Em preparação" : "Coming soon")}</p>
              <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">{hasAnyFilter ? (isPt ? "Vamos tentar outra busca?" : "Try another search?") : (isPt ? "Histórias estão a caminho." : "Stories are on their way.")}</h3>
              <p className="mt-4 text-muted-foreground">{hasAnyFilter ? t("blog.noPostsFound") : (isPt ? "Em breve, este espaço reunirá projetos, encontros e ideias da nossa comunidade." : "Soon, this space will bring together projects, encounters and ideas from our community.")}</p>
              {hasAnyFilter && <Button variant="outline" onClick={clearFilters} className="mt-6">{t("blog.clearFilters")}</Button>}
            </div>
          </div>
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
