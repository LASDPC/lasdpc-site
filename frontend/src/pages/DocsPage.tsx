import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { urlTransform } from "@/lib/markdown";
import { useDocs, useCreateDoc, useUpdateDoc, useDeleteDoc, useDocFolders, useCreateDocFolder, useDeleteDocFolder } from "@/hooks/useDocs";
import type { Doc } from "@/services/docs";
import {
  buildDocTree,
  allFolderPaths,
  ancestorFolders,
  docFolderPath,
  docFileName,
  normalizeDocPath,
  normalizeFolderPath,
  findDocFolder,
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
  Folder,
  FolderOpen,
  FolderPlus,
  Search,
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
  const { data: folders = [], isLoading: foldersLoading } = useDocFolders();
  const createDoc = useCreateDoc();
  const updateDoc = useUpdateDoc();
  const deleteDoc = useDeleteDoc();
  const createFolder = useCreateDocFolder();
  const deleteFolder = useDeleteDocFolder();

  const [activeId, setActiveId] = useState<string>("");
  const [currentFolder, setCurrentFolder] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const expandedInitialized = useRef(false);

  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [draftPath, setDraftPath] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [folderCreateOpen, setFolderCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const tree = useMemo(() => buildDocTree(docs, folders), [docs, folders]);

  // Start with every folder expanded the first time the tree arrives.
  useEffect(() => {
    if (!expandedInitialized.current && (docs.length > 0 || folders.length > 0)) {
      expandedInitialized.current = true;
      setExpanded(new Set(allFolderPaths(tree)));
    }
  }, [docs, folders, tree]);

  if (!user) {
    return <Navigate to="/login" state={{ from: "/docs" }} replace />;
  }

  if (isLoading || foldersLoading) return <DocsPageSkeleton isPt={isPt} />;

  // While activeId points to a doc not yet in the (possibly stale) list —
  // e.g. right after create, before the refetch lands — show nothing instead
  // of falling back to another doc, so edit mode never targets the wrong file.
  const activeDoc: Doc | undefined = activeId ? docs.find((d) => d.id === activeId) : undefined;
  const currentNode = findDocFolder(tree, currentFolder) ?? tree;
  const explicitFolder = folders.find((folder) => folder.path === currentFolder);
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const visibleFolders = currentNode.folders.filter((folder) => folder.name.toLocaleLowerCase().includes(normalizedSearch));
  const visibleFiles = currentNode.files.filter((doc) => docFileName(doc.path).toLocaleLowerCase().includes(normalizedSearch));

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
    setCurrentFolder(docFolderPath(doc.path));
    setSearchTerm("");
    setEditing(false);
  };

  const selectFolder = (path: string) => {
    if (hasUnsavedChanges && !window.confirm(isPt ? "Descartar alterações não salvas?" : "Discard unsaved changes?")) return;
    setActiveId("");
    setCurrentFolder(path);
    setSearchTerm("");
    setEditing(false);
    setExpanded((prev) => new Set([...prev, ...ancestorFolders(path), path].filter(Boolean)));
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
          setCurrentFolder(docFolderPath(normalized));
          setEditing(false);
          toast.success(isPt ? "Salvo com sucesso" : "Saved successfully");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const openCreateDialog = () => {
    setNewPath("");
    setCreateOpen(true);
  };

  const submitCreate = () => {
    const normalized = normalizeDocPath(currentFolder ? `${currentFolder}/${newPath}` : newPath);
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
          setCurrentFolder(docFolderPath(created.path));
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

  const submitCreateFolder = () => {
    if (!newFolderName.trim() || newFolderName.includes("/") || newFolderName.includes("\\")) {
      toast.error(isPt ? "Digite apenas o nome da pasta" : "Enter a folder name");
      return;
    }
    const normalized = normalizeFolderPath(currentFolder ? `${currentFolder}/${newFolderName}` : newFolderName);
    if (!normalized) {
      toast.error(isPt ? "Nome de pasta inválido" : "Invalid folder name");
      return;
    }
    createFolder.mutate(normalized, {
      onSuccess: (created) => {
        setFolderCreateOpen(false);
        setNewFolderName("");
        selectFolder(created.path);
        toast.success(isPt ? "Pasta criada" : "Folder created");
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const confirmDeleteFolder = () => {
    if (!explicitFolder || currentNode.folders.length || currentNode.files.length) return;
    if (!window.confirm(isPt ? `Excluir a pasta vazia "${currentFolder}"?` : `Delete the empty folder "${currentFolder}"?`)) return;
    deleteFolder.mutate(explicitFolder.id, {
      onSuccess: () => {
        selectFolder(docFolderPath(currentFolder));
        toast.success(isPt ? "Pasta excluída" : "Folder deleted");
      },
      onError: (err) => toast.error(err.message),
    });
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
      currentFolder={currentFolder}
      expanded={expanded}
      onToggleFolder={toggleFolder}
      onSelectFolder={selectFolder}
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
              ? `O documento será criado em ${currentFolder || "Início"}. A extensão .md é adicionada automaticamente.`
              : `The document will be created in ${currentFolder || "Home"}. The .md extension is added automatically.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="new-doc-path">{isPt ? "Nome do documento" : "Document name"}</Label>
          <Input
            id="new-doc-path"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            placeholder={isPt ? "Ata da reunião" : "Meeting notes"}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitCreate();
              }
            }}
          />
          {newPath && <p className="text-xs text-muted-foreground">{currentFolder ? `${currentFolder}/` : ""}{normalizeDocPath(newPath) ?? newPath}</p>}
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

  const renderFolderDialog = () => (
    <Dialog open={folderCreateOpen} onOpenChange={setFolderCreateOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPt ? "Nova pasta" : "New folder"}</DialogTitle>
          <DialogDescription>
            {isPt ? `Criar dentro de ${currentFolder || "Início"}.` : `Create inside ${currentFolder || "Home"}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="new-folder-name">{isPt ? "Nome da pasta" : "Folder name"}</Label>
          <Input id="new-folder-name" value={newFolderName} autoFocus
            onChange={(event) => setNewFolderName(event.target.value)}
            placeholder={isPt ? "Reuniões" : "Meetings"}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); submitCreateFolder(); } }} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setFolderCreateOpen(false)}>{isPt ? "Cancelar" : "Cancel"}</Button>
          <Button onClick={submitCreateFolder} disabled={createFolder.isPending}>
            <FolderPlus size={16} className="mr-2" />{isPt ? "Criar pasta" : "Create folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const isEmpty = docs.length === 0 && folders.length === 0;

  const renderBreadcrumbs = (folderPath: string, fileName?: string) => (
    <nav aria-label={isPt ? "Caminho" : "Path"} className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      <button type="button" onClick={() => selectFolder("")} className="hover:text-primary hover:underline">
        {isPt ? "Início" : "Home"}
      </button>
      {folderPath.split("/").filter(Boolean).map((segment, index, parts) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight size={14} />
          <button type="button" onClick={() => selectFolder(parts.slice(0, index + 1).join("/"))}
            className="hover:text-primary hover:underline">{segment}</button>
        </span>
      ))}
      {fileName && <span className="flex items-center gap-1 font-medium text-foreground"><ChevronRight size={14} />{fileName}</span>}
    </nav>
  );

  return (
    <div>
      <PageHeader
        icon={FileText}
        title={isPt ? "Documentação" : "Documentation"}
        eyebrow={isPt ? "Biblioteca interna" : "Internal library"}
        subtitle={
          isPt
            ? "Atas de reunião e documentos internos do laboratório, organizados em pastas."
            : "Meeting notes and internal lab documents, organized in folders."
        }
      />

        <div className="container mx-auto flex min-h-[calc(100vh-16rem)] flex-col gap-5 px-4 py-8 md:flex-row">
          {/* Desktop sidebar: VS Code-like explorer */}
          <aside className="surface-panel hidden max-h-[calc(100vh-8rem)] w-72 shrink-0 overflow-y-auto rounded-2xl md:sticky md:top-24 md:flex md:flex-col">
            <div className="p-3 flex-1">
              <div className="flex items-center justify-between px-1 mb-3">
                <button type="button" onClick={() => selectFolder("")} className="font-display font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2 hover:text-primary">
                  <FileText size={16} />
                  {isPt ? "Arquivos" : "Files"}
                </button>
                {user?.is_admin && <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openCreateDialog}
                    title={isPt ? "Novo documento" : "New document"} aria-label={isPt ? "Novo documento" : "New document"}><FilePlus size={15} /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setNewFolderName(""); setFolderCreateOpen(true); }}
                    title={isPt ? "Nova pasta" : "New folder"} aria-label={isPt ? "Nova pasta" : "New folder"}><FolderPlus size={15} /></Button>
                </div>}
              </div>
              {renderTree()}
            </div>

            <div className="p-4 border-t border-border">{renderUserBox()}</div>
          </aside>

          {/* Main content */}
          <div className="surface-panel min-w-0 flex-1 rounded-2xl">
            <div className="px-4 py-6 sm:px-6 md:px-10 md:py-10">
              {/* Mobile explorer + user box */}
              <div className="md:hidden mb-6 space-y-3">
                <div className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                      {isPt ? "Arquivos" : "Files"}
                    </p>
                    {user?.is_admin && <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openCreateDialog}
                        aria-label={isPt ? "Novo documento" : "New document"}><FilePlus size={15} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setNewFolderName(""); setFolderCreateOpen(true); }}
                        aria-label={isPt ? "Nova pasta" : "New folder"}><FolderPlus size={15} /></Button>
                    </div>}
                  </div>
                  {renderTree()}
                </div>
                <div className="rounded-md border border-border bg-card p-3">{renderUserBox()}</div>
              </div>

                  {activeDoc ? (
                <>
                  {/* Toolbar: breadcrumb + actions */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-1 text-xs font-mono text-muted-foreground">
                        {renderBreadcrumbs(docFolderPath(activeDoc.path), docFileName(activeDoc.path))}
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
                        visualEditing
                        lang={isPt ? "pt" : "en"}
                      />
                    </div>
                  ) : (
                    <article className={`${DOCS_PROSE} mx-auto max-w-3xl rounded-xl border border-border bg-background px-5 py-8 shadow-sm sm:px-10 sm:py-10`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform}>
                        {activeDoc.content}
                      </ReactMarkdown>
                    </article>
                  )}
                </>
              ) : (
                <section>
                  {renderBreadcrumbs(currentFolder)}
                  <div className="mb-6 mt-5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                        {currentFolder ? currentFolder.split("/").at(-1) : isPt ? "Documentos" : "Documents"}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isPt ? "Navegue pelas pastas e abra um documento para ler ou editar." : "Browse folders and open a document to read or edit."}
                      </p>
                    </div>
                    {user?.is_admin && (
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={openCreateDialog}><FilePlus size={16} className="mr-2" />{isPt ? "Novo documento" : "New document"}</Button>
                        <Button variant="outline" onClick={() => { setNewFolderName(""); setFolderCreateOpen(true); }}>
                          <FolderPlus size={16} className="mr-2" />{isPt ? "Nova pasta" : "New folder"}
                        </Button>
                      </div>
                    )}
                  </div>
                  {!isEmpty && (
                    <div className="relative mb-6">
                      <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={isPt ? "Buscar nesta pasta" : "Search this folder"} className="pl-10" />
                    </div>
                  )}
                  {visibleFolders.length || visibleFiles.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {visibleFolders.map((folder) => (
                        <button key={folder.path} type="button" onClick={() => selectFolder(folder.path)}
                          className="group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card/70 p-4 text-left transition hover:border-primary/40 hover:bg-secondary/60">
                          <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><Folder size={20} /></span>
                          <span className="min-w-0"><span className="block truncate font-semibold text-foreground group-hover:text-primary">{folder.name}</span>
                            <span className="text-xs text-muted-foreground">{folder.folders.length + folder.files.length} {isPt ? "itens" : "items"}</span></span>
                          <ChevronRight size={16} className="ml-auto shrink-0 text-muted-foreground" />
                        </button>
                      ))}
                      {visibleFiles.map((doc) => (
                        <button key={doc.id} type="button" onClick={() => selectFile(doc)}
                          className="group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card/70 p-4 text-left transition hover:border-primary/40 hover:bg-secondary/60">
                          <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><FileText size={20} /></span>
                          <span className="min-w-0"><span className="block truncate font-semibold text-foreground group-hover:text-primary">{docFileName(doc.path).replace(/\.md$/i, "")}</span>
                            <span className="text-xs text-muted-foreground">{isPt ? "Atualizado" : "Updated"} {doc.updatedAt}</span></span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-secondary/20 px-6 py-12 text-center">
                      {searchTerm ? <Search size={32} className="mx-auto text-primary" /> : <FolderOpen size={32} className="mx-auto text-primary" />}
                      <p className="mt-3 font-medium text-foreground">
                        {searchTerm ? isPt ? "Nenhum resultado nesta pasta" : "No results in this folder" : isPt ? "Esta pasta está vazia" : "This folder is empty"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{isPt ? "Crie uma pasta ou documento para começar." : "Create a folder or document to get started."}</p>
                    </div>
                  )}
                  {user?.is_admin && explicitFolder && currentNode.folders.length === 0 && currentNode.files.length === 0 && !searchTerm && (
                    <Button variant="ghost" size="sm" className="mt-6 text-destructive hover:text-destructive" onClick={confirmDeleteFolder} disabled={deleteFolder.isPending}>
                      <Trash2 size={15} className="mr-2" />{isPt ? "Excluir pasta vazia" : "Delete empty folder"}
                    </Button>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      {renderCreateDialog()}
      {renderFolderDialog()}
    </div>
  );
};

export default DocsPage;
