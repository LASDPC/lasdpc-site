import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { urlTransform } from "@/lib/markdown";
import { useDocs } from "@/hooks/useDocs";
import { FileText, BookOpen, Shield, GraduationCap, Plus, LogIn, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  <div className="min-h-[calc(100vh-4rem)] flex">
    <aside className="w-64 shrink-0 border-r border-border bg-card hidden md:block p-4 space-y-6">
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
  const { user, isAdmin, logout } = useAuth();
  const isPt = lang === "pt-BR";
  const navigate = useNavigate();

  const { data: docs = [], isLoading } = useDocs();

  const [activeDocId, setActiveDocId] = useState<string>("");

  if (!user) {
    return <Navigate to="/login" state={{ from: "/docs" }} replace />;
  }

  if (isLoading) return <DocsPageSkeleton />;

  const effectiveDocId = activeDocId || docs[0]?.id || "";
  const activeDoc = docs.find((d) => d.id === effectiveDocId);
  const categories = Array.from(new Set(docs.map((d) => d.category)));

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-card overflow-y-auto hidden md:block">
        <div className="p-4">
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
        <div className="p-4 border-t border-border mt-auto">
          {user ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut size={14} />
                {isPt ? "Sair" : "Logout"}
              </button>
            </div>
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
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile doc selector */}
        <div className="md:hidden p-4 border-b border-border">
          <select
            value={effectiveDocId}
            onChange={(e) => setActiveDocId(e.target.value)}
            className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm"
          >
            {docs.map((d) => (
              <option key={d.id} value={d.id}>
                {isPt ? d.titlePt : d.title}
              </option>
            ))}
          </select>
          {!user && (
            <Link
              to="/login"
              state={{ from: "/docs" }}
              className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <LogIn size={14} /> {isPt ? "Entrar como admin" : "Login as admin"}
            </Link>
          )}
        </div>

        {activeDoc && (
          <div className="p-6 sm:p-10 max-w-3xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  {categoryIcons[activeDoc.category]}
                  {categoryLabels[activeDoc.category]?.[isPt ? "pt" : "en"]}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isPt ? "Atualizado em" : "Updated"} {activeDoc.updatedAt}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/edit/doc/${activeDoc.id}`)}
                    className="inline-flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <FileText size={14} />
                    {isPt ? "Editar" : "Edit"}
                  </button>
                  <button
                    onClick={() => navigate("/admin/edit/doc")}
                    className="inline-flex items-center gap-1.5 text-sm bg-accent text-accent-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                  >
                    <Plus size={14} />
                    {isPt ? "Novo" : "New"}
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-a:text-primary prose-th:text-foreground prose-td:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform}>
                  {isPt ? activeDoc.contentPt : activeDoc.content}
                </ReactMarkdown>
            </article>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocsPage;
