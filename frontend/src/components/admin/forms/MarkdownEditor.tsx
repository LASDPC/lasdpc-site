import { useRef, useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Heading2, Code, Link2, ImagePlus, Columns2, PanelLeft, PanelRight, Minimize2, Maximize2, Crosshair } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { urlTransform } from "@/lib/markdown";

interface MarkdownEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  enableImageUpload?: boolean;
  proseClassName?: string;
}

const DEFAULT_PROSE =
  "prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary";

const IMG_PLACEHOLDER_RE = /!\[([^\]]*)\]\((img:\d+)\)/g;
const IMG_DATA_RE = /!\[([^\]]*)\]\((data:[^)]+)\)/g;

const expand = (text: string, map: Record<string, string>) =>
  text.replace(IMG_PLACEHOLDER_RE, (match, alt, id) => {
    const src = map[id];
    return src ? `![${alt}](${src})` : match;
  });

const collapse = (raw: string) => {
  const map: Record<string, string> = {};
  let counter = 0;
  const display = raw.replace(IMG_DATA_RE, (_match, alt, dataUri) => {
    counter += 1;
    const id = `img:${counter}`;
    map[id] = dataUri;
    return `![${alt}](${id})`;
  });
  return { display, map, counter };
};

type ViewMode = "split" | "editor" | "preview";

const MarkdownEditor = ({
  label,
  value,
  onChange,
  enableImageUpload = true,
  proseClassName = DEFAULT_PROSE,
}: MarkdownEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageMapRef = useRef<Record<string, string>>({});
  const counterRef = useRef(0);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [displayValue, setDisplayValue] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [collapsed, setCollapsed] = useState(false);
  const [syncMode, setSyncMode] = useState(true);
  const [editorHeight, setEditorHeight] = useState(300);

  useEffect(() => {
    const { display, map, counter } = collapse(value);
    imageMapRef.current = map;
    counterRef.current = counter;
    setDisplayValue(display);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // Auto-resize textarea to fit content and track its height
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el || collapsed) return;
    el.style.height = "auto";
    const h = Math.max(300, el.scrollHeight);
    el.style.height = h + "px";
    setEditorHeight(h);
  }, [collapsed]);

  useEffect(() => {
    autoResize();
  }, [displayValue, viewMode, collapsed, autoResize]);

  const handleDisplayChange = useCallback(
    (newDisplay: string) => {
      setDisplayValue(newDisplay);
      onChange(expand(newDisplay, imageMapRef.current));
    },
    [onChange],
  );

  // Sync preview to editor cursor position
  const syncPreviewToEditor = useCallback(() => {
    if (!syncMode || !textareaRef.current || !previewRef.current) return;

    const textarea = textareaRef.current;
    const text = textarea.value;
    if (!text) return;

    const cursorPos = textarea.selectionStart;
    const totalLines = text.split("\n").length;
    const currentLine = text.substring(0, cursorPos).split("\n").length;
    const ratio = totalLines <= 1 ? 0 : (currentLine - 1) / (totalLines - 1);

    const article = previewRef.current.querySelector("article");
    if (!article || article.children.length === 0) return;

    const blocks = article.children;
    const targetIdx = Math.min(Math.floor(ratio * blocks.length), blocks.length - 1);
    const target = blocks[targetIdx] as HTMLElement;

    // Clear previous highlights
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    article.querySelectorAll("[data-md-sync]").forEach(el => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.removeProperty("border-left");
      htmlEl.style.removeProperty("padding-left");
      htmlEl.style.removeProperty("transition");
      htmlEl.removeAttribute("data-md-sync");
    });

    // Highlight target block
    target.setAttribute("data-md-sync", "1");
    target.style.transition = "border-left 0.2s, padding-left 0.2s";
    target.style.borderLeft = "3px solid hsl(var(--primary))";
    target.style.paddingLeft = "8px";

    // Scroll the target into view within the preview container
    target.scrollIntoView({ behavior: "smooth", block: "nearest" });

    highlightTimerRef.current = setTimeout(() => {
      target.style.removeProperty("border-left");
      target.style.removeProperty("padding-left");
      target.style.removeProperty("transition");
      target.removeAttribute("data-md-sync");
    }, 2000);
  }, [syncMode]);

  const insertAtCursor = (before: string, after = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = displayValue.slice(start, end);
    const insertion = before + selected + after;
    const newDisplay = displayValue.slice(0, start) + insertion + displayValue.slice(end);
    handleDisplayChange(newDisplay);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length + selected.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      counterRef.current += 1;
      const id = `img:${counterRef.current}`;
      imageMapRef.current[id] = base64;

      const alt = file.name.replace(/\.[^.]+$/, "");
      const placeholder = `![${alt}](${id})\n`;

      const el = textareaRef.current;
      const start = el ? el.selectionStart : displayValue.length;
      const newDisplay = displayValue.slice(0, start) + placeholder + displayValue.slice(start);
      handleDisplayChange(newDisplay);
    };
    reader.readAsDataURL(file);
  };

  const previewMarkdown = expand(displayValue, imageMapRef.current);

  const showEditor = viewMode === "split" || viewMode === "editor";
  const showPreview = viewMode === "split" || viewMode === "preview";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant={syncMode ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setSyncMode(!syncMode)}
            title={syncMode ? "Disable sync scroll" : "Enable sync scroll"}
          >
            <Crosshair size={14} />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            type="button"
            variant={viewMode === "editor" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode(viewMode === "editor" ? "split" : "editor")}
            title="Editor only"
          >
            <PanelLeft size={14} />
          </Button>
          <Button
            type="button"
            variant={viewMode === "split" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("split")}
            title="Split view"
          >
            <Columns2 size={14} />
          </Button>
          <Button
            type="button"
            variant={viewMode === "preview" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode(viewMode === "preview" ? "split" : "preview")}
            title="Preview only"
          >
            <PanelRight size={14} />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            type="button"
            variant={collapsed ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand to full height" : "Minimize to fixed height"}
          >
            {collapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </Button>
        </div>
      </div>
      <div className={`grid gap-4 ${viewMode === "split" ? "grid-cols-2" : "grid-cols-1"}`}>
        {/* Editor */}
        {showEditor && (
          <div className={`flex flex-col ${collapsed ? "h-[360px] overflow-y-auto" : ""}`}>
            <div className="flex gap-1 mb-1 shrink-0">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertAtCursor("**", "**")}>
                <Bold size={14} />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertAtCursor("*", "*")}>
                <Italic size={14} />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertAtCursor("## ")}>
                <Heading2 size={14} />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertAtCursor("`", "`")}>
                <Code size={14} />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertAtCursor("[", "](url)")}>
                <Link2 size={14} />
              </Button>
              {enableImageUpload && (
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus size={14} />
                </Button>
              )}
            </div>
            <textarea
              ref={textareaRef}
              value={displayValue}
              onChange={(e) => handleDisplayChange(e.target.value)}
              onClick={syncPreviewToEditor}
              onKeyUp={syncPreviewToEditor}
              className={`w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm font-mono ${
                collapsed
                  ? "flex-1 min-h-0 resize-none overflow-y-auto"
                  : "min-h-[300px] resize-none overflow-hidden"
              }`}
            />
            {enableImageUpload && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = "";
                }}
              />
            )}
          </div>
        )}

        {/* Preview — height follows editor, scrolls internally */}
        {showPreview && (
          <div className="flex flex-col">
            {/* Spacer matching the toolbar height */}
            {showEditor && <div className="h-7 mb-1 shrink-0" />}
          <div
            ref={previewRef}
            className="border border-border rounded-md px-4 py-3 bg-background overflow-y-auto"
            style={
              collapsed
                ? { height: 360 }
                : { height: editorHeight, minHeight: 300 }
            }
          >
            <article className={proseClassName}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform}>
                {previewMarkdown}
              </ReactMarkdown>
            </article>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
