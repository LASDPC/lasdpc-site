import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { urlTransform } from "@/lib/markdown";
import { useDocs } from "@/hooks/useDocs";
import {
  FileText,
  BookOpen,
  Shield,
  GraduationCap,
  LogIn,
  LogOut,
  FilePlus,
  Inbox,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const categoryIcons: Record<string, React.ReactNode> = {
  guides: <BookOpen size={16} />,
  policies: <Shield size={16} />,
  tutorials: <GraduationCap size={16} />,
};

const categoryLabels: Record<string, { pt: string; en: string }> = {
  guides: { pt: "Guias", en: "Guides" },
  policies: { pt: "Políticas", en: "Policies" },
  tutorials: { pt: "Tutoriais", en: "Tutorials" },
};

const DocsPageSkeleton = () => (
  <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row">
    <aside className="hidden md:block w-64 shrink-0 border-r border-border bg-card p-4 space-y-6">
      <Skeleton className="h-7 w-20 mb-4" />
      {Array.from({ length: 3 }).map((_, g) => (
        <div key={g} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      ))}
    </aside>
    <div className="flex-1 p-6 sm:p-10 max-w-3xl space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-9 w-3/4" />
      <div className="space-y-3 pt-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 5 === 4 ? "w-1/2" : i % 3 === 2 ? "w-5/6" : "w-full"}`} />
        ))}
      </div>
    </div>
  </div>
);

const DocsPage = () => {
  const { lang } = useLang();
  const { user, logout } = useAuth();
  const isPt = lang === "pt-BR";

  const { data: docs = [], isLoading } = useDocs();

  const [activeDocId, setActiveDocId] = useState<string>("");

  if (!user) {
    return <Navigate to="/login" state={{ from: "/docs" }} replace />;
  }

  if (isLoading) return <DocsPageSkeleton />;

  const isEmpty = docs.length === 0;
  const effectiveDocId = isEmpty ? "" : activeDocId || docs[0]?.id || "";
  const activeDoc = docs.find((d) => d.id === effectiveDocId);
  const categories = Array.from(new Set(docs.map((d) => d.category)));

  const renderUserBox = (compact = false) => (
    <div className={compact ? "" : "space-y-2"}>
      {user ? (
        <>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={14} />
            {isPt ? "Sair" : "Logout"}
          </button>
        </>
      ) : (
        <Link
          to="/login"
          state={{ from: "/docs" }}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <LogIn size={14} />
          {isPt ? "Entrar como admin" : "Login as admin"}
        </Link>
      )}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row">
      {/* Desktop sidebar (only when there are docs) */}
      {!isEmpty && (
        <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-border bg-card overflow-y-auto">
          <div className="p-4 flex-1">
            <h2 className="font-display font-bold text-foreground text-lg mb-4 flex items-center gap-2">
              <FileText size={20} />
              Docs
            </h2>

            {categories.map((cat) => (
              <div key={cat} className="mb-4">
                <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  {categoryIcons[cat]}
                  {categoryLabels[cat]?.[isPt ? "pt" : "en"] ?? cat}
                </p>
                <ul className="space-y-0.5">
                  {docs
                    .filter((d) => d.category === cat)
                    .map((d) => (
                      <li key={d.id}>
                        <button
                          onClick={() => setActiveDocId(d.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            effectiveDocId === d.id
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          {isPt ? d.titlePt : d.title}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Auth section at bottom */}
          <div className="p-4 border-t border-border">{renderUserBox()}</div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {isEmpty ? (
          // Empty state: center on the full content area (no sidebar in this case).
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 md:py-16">
            <div className="w-full max-w-xl">
              <div className="flex items-center justify-center gap-3 mb-8">
                <FileText className="h-7 w-7 md:h-8 md:w-8 text-primary shrink-0" />
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  {isPt ? "Documentação" : "Documentation"}
                </h1>
              </div>
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 sm:p-12 flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 text-primary p-4 mb-5">
                  <Inbox size={32} />
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-2">
                  {isPt ? "Nenhuma documentação ainda" : "No documentation yet"}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  {isPt
                    ? "Ainda não há páginas de documentação disponíveis. Volte mais tarde."
                    : "There are no documentation pages available yet. Check back later."}
                </p>
                {user?.is_admin && (
                  <Button asChild>
                    <Link to="/admin/edit/doc">
                      <FilePlus size={16} className="mr-2" />
                      {isPt ? "Criar primeira doc" : "Create first doc"}
                    </Link>
                  </Button>
                )}

                {/* Mobile-only user box on empty state */}
                <div className="md:hidden mt-8 w-full rounded-md border border-border bg-card p-3 text-left">
                  {renderUserBox()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 sm:px-6 md:px-10 py-6 md:py-10 max-w-3xl">
            {/* Page header */}
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <FileText className="h-7 w-7 md:h-8 md:w-8 text-primary shrink-0" />
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                {isPt ? "Documentação" : "Documentation"}
              </h1>
            </div>

            {/* Mobile doc selector + user box */}
            <div className="md:hidden mb-6 space-y-3">
              <select
                value={effectiveDocId}
                onChange={(e) => setActiveDocId(e.target.value)}
                className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border"
                aria-label={isPt ? "Selecionar documento" : "Select document"}
              >
                {categories.map((cat) => (
                  <optgroup
                    key={cat}
                    label={categoryLabels[cat]?.[isPt ? "pt" : "en"] ?? cat}
                  >
                    {docs
                      .filter((d) => d.category === cat)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {isPt ? d.titlePt : d.title}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <div className="rounded-md border border-border bg-card p-3">
                {renderUserBox()}
              </div>
            </div>

            {activeDoc && (
              <article className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-a:text-primary prose-th:text-foreground prose-td:text-foreground">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6 not-prose">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      {categoryIcons[activeDoc.category]}
                      {categoryLabels[activeDoc.category]?.[isPt ? "pt" : "en"]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isPt ? "Atualizado em" : "Updated"} {activeDoc.updatedAt}
                    </p>
                  </div>
                </div>

                <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform}>
                  {isPt ? activeDoc.contentPt : activeDoc.content}
                </ReactMarkdown>
              </article>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocsPage;
