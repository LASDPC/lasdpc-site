import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import docs from "@/data/MOCKED_DOCS.json";
import { FileText, BookOpen, Shield, GraduationCap, Plus, LogIn, LogOut, Save, X } from "lucide-react";
import { toast } from "sonner";

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

const DocsPage = () => {
  const { lang } = useLang();
  const { user, login, logout } = useAuth();
  const isPt = lang === "pt-BR";

  const [activeDocId, setActiveDocId] = useState(docs[0]?.id ?? "");
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const activeDoc = docs.find((d) => d.id === activeDocId);

  const categories = Array.from(new Set(docs.map((d) => d.category)));

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(loginEmail, loginPassword);
    if (ok) {
      setShowLogin(false);
      setLoginEmail("");
      setLoginPassword("");
      toast.success(isPt ? "Login realizado!" : "Logged in!");
    } else {
      toast.error(isPt ? "Credenciais inválidas" : "Invalid credentials");
    }
  };

  const startEditing = () => {
    if (!activeDoc) return;
    setEditContent(isPt ? activeDoc.contentPt : activeDoc.content);
    setEditing(true);
  };

  const saveEdit = () => {
    setEditing(false);
    toast.success(isPt ? "Documentação salva (mock)" : "Documentation saved (mock)");
  };

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
                        onClick={() => { setActiveDocId(d.id); setEditing(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          activeDocId === d.id
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
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <LogIn size={14} />
              {isPt ? "Entrar como admin" : "Login as admin"}
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile doc selector */}
        <div className="md:hidden p-4 border-b border-border">
          <select
            value={activeDocId}
            onChange={(e) => { setActiveDocId(e.target.value); setEditing(false); }}
            className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm"
          >
            {docs.map((d) => (
              <option key={d.id} value={d.id}>
                {isPt ? d.titlePt : d.title}
              </option>
            ))}
          </select>
          {!user && (
            <button onClick={() => setShowLogin(true)} className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline">
              <LogIn size={14} /> {isPt ? "Entrar como admin" : "Login as admin"}
            </button>
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
                {!editing && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isPt ? "Atualizado em" : "Updated"} {activeDoc.updatedAt}
                  </p>
                )}
              </div>
              {user && !editing && (
                <div className="flex gap-2">
                  <button
                    onClick={startEditing}
                    className="inline-flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <FileText size={14} />
                    {isPt ? "Editar" : "Edit"}
                  </button>
                  <button className="inline-flex items-center gap-1.5 text-sm bg-accent text-accent-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity">
                    <Plus size={14} />
                    {isPt ? "Novo" : "New"}
                  </button>
                </div>
              )}
              {user && editing && (
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="inline-flex items-center gap-1.5 text-sm bg-accent text-accent-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                  >
                    <Save size={14} />
                    {isPt ? "Salvar" : "Save"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-1.5 text-sm bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <X size={14} />
                    {isPt ? "Cancelar" : "Cancel"}
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            {editing ? (
              <div className="space-y-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[60vh] bg-card border border-border rounded-lg p-4 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                  placeholder="Write markdown here..."
                />
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
                    {isPt ? "Pré-visualização" : "Preview"}
                  </p>
                  <div className="bg-card border border-border rounded-lg p-6 prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-a:text-primary prose-th:text-foreground prose-td:text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{editContent}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-a:text-primary prose-th:text-foreground prose-td:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {isPt ? activeDoc.contentPt : activeDoc.content}
                </ReactMarkdown>
              </article>
            )}
          </div>
        )}
      </div>

      {/* Login modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-lg">
            <h3 className="font-display font-bold text-foreground text-lg mb-4">
              {isPt ? "Login Administrativo" : "Admin Login"}
            </h3>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
              <input
                type="password"
                placeholder={isPt ? "Senha" : "Password"}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                  {isPt ? "Entrar" : "Login"}
                </button>
                <button type="button" onClick={() => setShowLogin(false)} className="flex-1 bg-secondary text-secondary-foreground rounded-md py-2 text-sm font-medium hover:bg-muted transition-colors">
                  {isPt ? "Cancelar" : "Cancel"}
                </button>
              </div>
            </form>
            <p className="text-xs text-muted-foreground mt-3">
              {isPt ? "Use" : "Use"}: admin@lasdpc.usp.br / lasdpc2024
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocsPage;
