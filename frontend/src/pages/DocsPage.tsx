import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { urlTransform } from "@/lib/markdown";
import { useDocs, useCreateDoc, useUpdateDoc, useDeleteDoc } from "@/hooks/useDocs";
import type { Doc } from "@/services/docs";
import {
  buildDocTree,
  allFolderPaths,
  ancestorFolders,
  docFolderPath,
  docFileName,
  normalizeDocPath,
} from "@/lib/docTree";
import DocTree from "@/components/docs/DocTree";
import MarkdownEditor from "@/components/admin/forms/MarkdownEditor";
import {
  FileText,
  FilePlus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronRight,
  LogIn,
  LogOut,
  Inbox,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";

const DOCS_PROSE =
  "prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-a:text-primary prose-th:text-foreground prose-td:text-foreground";

const today = () => new Date().toISOString().split("T")[0];

const DocsPageSkeleton = ({ isPt }: { isPt: boolean }) => (
  <div>
    <PageHeader icon={FileText} title={isPt ? "Documentação" : "Documentation"} />
    <div className="min-h-[calc(100vh-12rem)] flex flex-col md:flex-row">
      <aside className="hidden md:block w-64 shrink-0 border-r border-border bg-card p-4 space-y-2">
        <Skeleton className="h-7 w-20 mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full rounded-md" style={{ marginLeft: (i % 3) * 12 }} />
        ))}
      </aside>
      <div className="flex-1 p-6 sm:p-10 max-w-3xl space-y-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-9 w-3/4" />
        <div className="space-y-3 pt-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-4 ${i % 5 === 4 ? "w-1/2" : i % 3 === 2 ? "w-5/6" : "w-full"}`}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const DocsPage = () => {
  const { lang } = useLang();
  const { user, logout } = useAuth();
  const isPt = lang === "pt-BR";

  const { data: docs = [], isLoading } = useDocs();
  const createDoc = useCreateDoc();
  const updateDoc = useUpdateDoc();
  const deleteDoc = useDeleteDoc();

  const [activeId, setActiveId] = useState<string>("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const expandedInitialized = useRef(false);

  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [draftPath, setDraftPath] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newPath, setNewPath] = useState("");

  const tree = useMemo(() => buildDocTree(docs), [docs]);

  // Start with every folder expanded the first time the tree arrives.
  useEffect(() => {
    if (!expandedInitialized.current && docs.length > 0) {
      expandedInitialized.current = true;
      setExpanded(new Set(allFolderPaths(buildDocTree(docs))));
    }
  }, [docs]);

  if (!user) {
    return <Navigate to="/login" state={{ from: "/docs" }} replace />;
  }

  if (isLoading) return <DocsPageSkeleton isPt={isPt} />;

  // While activeId points to a doc not yet in the (possibly stale) list —
  // e.g. right after create, before the refetch lands — show nothing instead
  // of falling back to another doc, so edit mode never targets the wrong file.
  const activeDoc: Doc | undefined = activeId
    ? docs.find((d) => d.id === activeId)
    : docs[0];

  const hasUnsavedChanges =
    editing && activeDoc && (draftContent !== activeDoc.content || draftPath !== activeDoc.path);

  const revealPath = (path: string) =>
    setExpanded((prev) => new Set([...prev, ...ancestorFolders(path)]));

  const selectFile = (doc: Doc) => {
    if (doc.id === activeDoc?.id) return;
    if (hasUnsavedChanges) {
      const msg = isPt
        ? "Descartar alterações não salvas?"
        : "Discard unsaved changes?";
      if (!window.confirm(msg)) return;
    }
    setActiveId(doc.id);
    setEditing(false);
  };

  const toggleFolder = (path: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const startEdit = () => {
    if (!activeDoc) return;
    setDraftContent(activeDoc.content);
    setDraftPath(activeDoc.path);
    setEditing(true);
  };

  const saveEdit = () => {
    if (!activeDoc) return;
    const normalized = normalizeDocPath(draftPath);
    if (!normalized) {
      toast.error(isPt ? "Caminho inválido" : "Invalid path");
      return;
    }
    updateDoc.mutate(
      { id: activeDoc.id, data: { path: normalized, content: draftContent, updatedAt: today() } },
      {
        onSuccess: () => {
          revealPath(normalized);
          setEditing(false);
          toast.success(isPt ? "Salvo com sucesso" : "Saved successfully");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const openCreateDialog = () => {
    const folder = activeDoc ? docFolderPath(activeDoc.path) : "";
    setNewPath(folder ? `${folder}/` : "");
    setCreateOpen(true);
  };

  const submitCreate = () => {
    const normalized = normalizeDocPath(newPath);
    if (!normalized) {
      toast.error(isPt ? "Caminho inválido" : "Invalid path");
      return;
    }
    const title = docFileName(normalized).replace(/\.md$/i, "");
    createDoc.mutate(
      { path: normalized, content: `# ${title}\n\n`, updatedAt: today() },
      {
        onSuccess: (created) => {
          setCreateOpen(false);
          setActiveId(created.id);
          revealPath(created.path);
          setDraftContent(created.content);
          setDraftPath(created.path);
          setEditing(true);
          toast.success(isPt ? "Arquivo criado" : "File created");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const confirmDelete = () => {
    if (!activeDoc) return;
    const msg = isPt
      ? `Excluir "${activeDoc.path}"? Essa ação não pode ser desfeita.`
      : `Delete "${activeDoc.path}"? This cannot be undone.`;
    if (!window.confirm(msg)) return;
    deleteDoc.mutate(activeDoc.id, {
      onSuccess: () => {
        setActiveId("");
        setEditing(false);
        toast.success(isPt ? "Arquivo excluído" : "File deleted");
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const renderUserBox = () => (
    <div className="space-y-2">
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

  const renderTree = () => (
    <DocTree
      root={tree}
      activePath={activeDoc?.path ?? ""}
      expanded={expanded}
      onToggleFolder={toggleFolder}
      onSelectFile={selectFile}
    />
  );

  const renderCreateDialog = () => (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPt ? "Novo arquivo" : "New file"}</DialogTitle>
          <DialogDescription>
            {isPt
              ? "Use / para organizar em pastas — elas são criadas automaticamente a partir do caminho."
              : "Use / to organize into folders — they are created automatically from the path."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="new-doc-path">{isPt ? "Caminho do arquivo" : "File path"}</Label>
          <Input
            id="new-doc-path"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            placeholder={`reunioes/2026/ata-${today()}.md`}
            className="font-mono"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitCreate();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>
            {isPt ? "Cancelar" : "Cancel"}
          </Button>
          <Button onClick={submitCreate} disabled={createDoc.isPending}>
            <FilePlus size={16} className="mr-2" />
            {isPt ? "Criar" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const isEmpty = docs.length === 0;

  return (
    <div>
      <PageHeader
        icon={FileText}
        title={isPt ? "Documentação" : "Documentation"}
        subtitle={
          isPt
            ? "Atas de reunião e documentos internos do laboratório, organizados em pastas."
            : "Meeting notes and internal lab documents, organized in folders."
        }
      />

      {isEmpty ? (
        <div className="container mx-auto px-4 py-12 md:py-16 flex justify-center">
          <div className="w-full max-w-xl rounded-xl border border-dashed border-border bg-card/50 p-8 sm:p-12 flex flex-col items-center text-center">
            <div className="rounded-full bg-primary/10 text-primary p-4 mb-5">
              <Inbox size={32} />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-2">
              {isPt ? "Nenhum arquivo ainda" : "No files yet"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              {isPt
                ? "Crie o primeiro arquivo Markdown para começar a organizar as reuniões."
                : "Create the first Markdown file to start organizing meetings."}
            </p>
            {user?.is_admin && (
              <Button onClick={openCreateDialog}>
                <FilePlus size={16} className="mr-2" />
                {isPt ? "Criar primeiro arquivo" : "Create first file"}
              </Button>
            )}

            <div className="md:hidden mt-8 w-full rounded-md border border-border bg-card p-3 text-left">
              {renderUserBox()}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-16rem)]">
          {/* Desktop sidebar: VS Code-like explorer */}
          <aside className="hidden md:flex md:flex-col w-72 shrink-0 border-r border-border bg-card overflow-y-auto">
            <div className="p-3 flex-1">
              <div className="flex items-center justify-between px-1 mb-3">
                <h2 className="font-display font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} />
                  {isPt ? "Arquivos" : "Files"}
                </h2>
                {user?.is_admin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={openCreateDialog}
                    title={isPt ? "Novo arquivo" : "New file"}
                  >
                    <FilePlus size={15} />
                  </Button>
                )}
              </div>
              {renderTree()}
            </div>

            <div className="p-4 border-t border-border">{renderUserBox()}</div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className={`px-4 sm:px-6 md:px-10 py-6 md:py-10 ${editing ? "" : "max-w-3xl"}`}>
              {/* Mobile explorer + user box */}
              <div className="md:hidden mb-6 space-y-3">
                <div className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                      {isPt ? "Arquivos" : "Files"}
                    </p>
                    {user?.is_admin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={openCreateDialog}
                        title={isPt ? "Novo arquivo" : "New file"}
                      >
                        <FilePlus size={15} />
                      </Button>
                    )}
                  </div>
                  {renderTree()}
                </div>
                <div className="rounded-md border border-border bg-card p-3">{renderUserBox()}</div>
              </div>

              {activeDoc && (
                <>
                  {/* Toolbar: breadcrumb + actions */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-1 text-xs font-mono text-muted-foreground">
                        {activeDoc.path.split("/").map((segment, i, arr) => (
                          <span key={i} className="flex items-center gap-1">
                            {i > 0 && <ChevronRight size={12} className="shrink-0" />}
                            <span className={i === arr.length - 1 ? "text-foreground font-semibold" : ""}>
                              {segment}
                            </span>
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isPt ? "Atualizado em" : "Updated"} {activeDoc.updatedAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {editing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing(false)}
                            disabled={updateDoc.isPending}
                          >
                            <X size={15} className="mr-1.5" />
                            {isPt ? "Cancelar" : "Cancel"}
                          </Button>
                          <Button size="sm" onClick={saveEdit} disabled={updateDoc.isPending}>
                            <Check size={15} className="mr-1.5" />
                            {updateDoc.isPending ? "..." : isPt ? "Salvar" : "Save"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={startEdit}
                            title={isPt ? "Editar" : "Edit"}
                          >
                            <Pencil size={15} />
                          </Button>
                          {user?.is_admin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={confirmDelete}
                              disabled={deleteDoc.isPending}
                              title={isPt ? "Excluir" : "Delete"}
                            >
                              <Trash2 size={15} />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {editing ? (
                    <div className="space-y-4">
                      <div className="max-w-md">
                        <Label htmlFor="doc-path">{isPt ? "Caminho do arquivo" : "File path"}</Label>
                        <Input
                          id="doc-path"
                          value={draftPath}
                          onChange={(e) => setDraftPath(e.target.value)}
                          className="font-mono mt-1"
                        />
                      </div>
                      <MarkdownEditor
                        label={docFileName(activeDoc.path)}
                        value={draftContent}
                        onChange={setDraftContent}
                        proseClassName={DOCS_PROSE}
                      />
                    </div>
                  ) : (
                    <article className={DOCS_PROSE}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform}>
                        {activeDoc.content}
                      </ReactMarkdown>
                    </article>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {renderCreateDialog()}
    </div>
  );
};

export default DocsPage;
