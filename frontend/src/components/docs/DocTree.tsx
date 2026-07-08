import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import type { Doc } from "@/services/docs";
import { docFileName, type DocTreeFolder } from "@/lib/docTree";

interface DocTreeProps {
  root: DocTreeFolder;
  activePath: string;
  expanded: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectFile: (doc: Doc) => void;
}

const INDENT_PX = 14;

/** VS Code-style explorer tree: collapsible folders with .md files inside. */
const DocTree = ({ root, activePath, expanded, onToggleFolder, onSelectFile }: DocTreeProps) => (
  <div role="tree" className="text-sm select-none space-y-0.5">
    <FolderChildren
      folder={root}
      depth={0}
      activePath={activePath}
      expanded={expanded}
      onToggleFolder={onToggleFolder}
      onSelectFile={onSelectFile}
    />
  </div>
);

interface NodeProps {
  depth: number;
  activePath: string;
  expanded: Set<string>;
  onToggleFolder: (path: string) => void;
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
  return (
    <div role="treeitem" aria-expanded={isOpen}>
      <button
        type="button"
        onClick={() => rest.onToggleFolder(folder.path)}
        style={{ paddingLeft: depth * INDENT_PX + 8 }}
        className="w-full flex items-center gap-1.5 pr-2 py-1 rounded-md text-foreground hover:bg-secondary transition-colors"
      >
        <ChevronRight
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
        {isOpen ? (
          <FolderOpen size={15} className="shrink-0 text-primary" />
        ) : (
          <Folder size={15} className="shrink-0 text-primary" />
        )}
        <span className="truncate">{folder.name}</span>
      </button>
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
