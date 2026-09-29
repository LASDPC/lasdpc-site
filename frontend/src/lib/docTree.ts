import type { Doc, DocFolder } from "@/services/docs";

export interface DocTreeFolder {
  name: string;
  /** Full folder path from the root, "" for the root itself. */
  path: string;
  folders: DocTreeFolder[];
  files: Doc[];
}

/** Derive the folder tree from the flat list of doc paths (folders are implicit). */
export function buildDocTree(docs: Doc[], explicitFolders: DocFolder[] = []): DocTreeFolder {
  const root: DocTreeFolder = { name: "", path: "", folders: [], files: [] };
  const folderIndex = new Map<string, DocTreeFolder>([["", root]]);

  const ensureFolder = (path: string): DocTreeFolder => {
    const existing = folderIndex.get(path);
    if (existing) return existing;
    const idx = path.lastIndexOf("/");
    const parent = ensureFolder(idx === -1 ? "" : path.slice(0, idx));
    const folder: DocTreeFolder = {
      name: idx === -1 ? path : path.slice(idx + 1),
      path,
      folders: [],
      files: [],
    };
    parent.folders.push(folder);
    folderIndex.set(path, folder);
    return folder;
  };

  for (const folder of explicitFolders) ensureFolder(folder.path);

  for (const doc of docs) {
    ensureFolder(docFolderPath(doc.path)).files.push(doc);
  }

  const sortFolder = (folder: DocTreeFolder) => {
    folder.folders.sort((a, b) => a.name.localeCompare(b.name));
    folder.files.sort((a, b) => a.path.localeCompare(b.path));
    folder.folders.forEach(sortFolder);
  };
  sortFolder(root);
  return root;
}

export function docFileName(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? path : path.slice(idx + 1);
}

export function docFolderPath(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? "" : path.slice(0, idx);
}

/** All folder paths in the tree, e.g. ["reunioes", "reunioes/2026"]. */
export function allFolderPaths(root: DocTreeFolder): string[] {
  const acc: string[] = [];
  const walk = (folder: DocTreeFolder) => {
    if (folder.path) acc.push(folder.path);
    folder.folders.forEach(walk);
  };
  walk(root);
  return acc;
}

/** Ancestor folder paths of a file path: "a/b/c.md" -> ["a", "a/b"]. */
export function ancestorFolders(path: string): string[] {
  const parts = path.split("/");
  const acc: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    acc.push(parts.slice(0, i).join("/"));
  }
  return acc;
}

/**
 * Normalize a user-typed path: trims segments, collapses slashes and appends
 * ".md" when missing. Returns null when invalid. Mirrors the backend rules.
 */
export function normalizeDocPath(raw: string): string | null {
  const collapsed = raw.trim().replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
  if (!collapsed) return null;
  const segments = collapsed.split("/").map((s) => s.trim());
  if (segments.some((s) => !s || s === "." || s === ".." || /[:*?"<>|]/.test(s))) return null;
  let last = segments[segments.length - 1];
  if (!/\.md$/i.test(last)) last = `${last}.md`;
  if (last.toLowerCase() === ".md") return null;
  segments[segments.length - 1] = last;
  return segments.join("/");
}

export function normalizeFolderPath(raw: string): string | null {
  const collapsed = raw.trim().replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
  if (!collapsed) return null;
  const segments = collapsed.split("/").map((s) => s.trim());
  if (segments.some((s) => !s || s === "." || s === ".." || /[:*?"<>|]/.test(s))) return null;
  return segments.join("/");
}

export function findDocFolder(root: DocTreeFolder, path: string): DocTreeFolder | undefined {
  if (!path) return root;
  return path.split("/").reduce<DocTreeFolder | undefined>((folder, segment) => folder?.folders.find((child) => child.name === segment), root);
}
