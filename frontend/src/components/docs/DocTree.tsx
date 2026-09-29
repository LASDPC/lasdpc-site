import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import type { Doc } from "@/services/docs";
import { docFileName, type DocTreeFolder } from "@/lib/docTree";

interface DocTreeProps {
  root: DocTreeFolder;
  activePath: string;
  currentFolder: string;
  expanded: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectFolder: (path: string) => void;
  onSelectFile: (doc: Doc) => void;
}

const INDENT_PX = 14;

/** VS Code-style explorer tree: collapsible folders with .md files inside. */
const DocTree = ({ root, activePath, currentFolder, expanded, onToggleFolder, onSelectFolder, onSelectFile }: DocTreeProps) => (
  <div role="tree" className="text-sm select-none space-y-0.5">
    <FolderChildren
      folder={root}
      depth={0}
      activePath={activePath}
      currentFolder={currentFolder}
      expanded={expanded}
      onToggleFolder={onToggleFolder}
      onSelectFolder={onSelectFolder}
      onSelectFile={onSelectFile}
    />
  </div>
);

interface NodeProps {
  depth: number;
  activePath: string;
  currentFolder: string;
  expanded: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectFolder: (path: string) => void;
  onSelectFile: (doc: Doc) => void;
}

const FolderChildren = ({ folder, ...rest }: NodeProps & { folder: DocTreeFolder }) => (
  <>
    {folder.folders.map((child) => (
      <FolderNode key={child.path} folder={child} {...rest} />
    ))}
    {folder.files.map((file) => (
      <FileNode key={file.id} file={file} {...rest} />
    ))}
  </>
);

const FolderNode = ({ folder, depth, ...rest }: NodeProps & { folder: DocTreeFolder }) => {
  const isOpen = rest.expanded.has(folder.path);
  const isSelected = !rest.activePath && rest.currentFolder === folder.path;
  return (
    <div role="treeitem" aria-expanded={isOpen}>
      <div
        className={`flex items-center rounded-md transition-colors ${isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"}`}
        style={{ paddingLeft: depth * INDENT_PX + 4 }}
      >
      <button
        type="button"
        onClick={() => rest.onToggleFolder(folder.path)}
        className="flex h-8 w-6 shrink-0 items-center justify-center"
        aria-label={`${isOpen ? "Collapse" : "Expand"} ${folder.name}`}
      >
        <ChevronRight
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </button>
      <button type="button" onClick={() => rest.onSelectFolder(folder.path)}
        className="flex min-w-0 flex-1 items-center gap-1.5 py-1 pr-2 text-left">
        {isOpen ? (
          <FolderOpen size={15} className="shrink-0 text-primary" />
        ) : (
          <Folder size={15} className="shrink-0 text-primary" />
        )}
        <span className="truncate">{folder.name}</span>
      </button>
      </div>
      {isOpen && <FolderChildren folder={folder} depth={depth + 1} {...rest} />}
    </div>
  );
};

const FileNode = ({ file, depth, activePath, onSelectFile }: NodeProps & { file: Doc }) => {
  const isActive = activePath === file.path;
  return (
    <button
      type="button"
      role="treeitem"
      aria-selected={isActive}
      onClick={() => onSelectFile(file)}
      style={{ paddingLeft: depth * INDENT_PX + 8 + 14 + 6 }}
      className={`w-full flex items-center gap-1.5 pr-2 py-1 rounded-md transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground font-medium"
          : "text-foreground hover:bg-secondary"
      }`}
    >
      <FileText size={15} className={`shrink-0 ${isActive ? "" : "text-muted-foreground"}`} />
      <span className="truncate">{docFileName(file.path)}</span>
    </button>
  );
};

export default DocTree;
