import { useRef, useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Heading2, Code, Link2, ImagePlus } from "lucide-react";
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

/** Replace all `img:N` placeholders with their base64 data URIs. */
const expand = (text: string, map: Record<string, string>) =>
  text.replace(IMG_PLACEHOLDER_RE, (match, alt, id) => {
    const src = map[id];
    return src ? `![${alt}](${src})` : match;
  });

/** Extract `data:` images from raw markdown, store them in a map, and return display text with placeholders. */
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

const MarkdownEditor = ({
  label,
  value,
  onChange,
  enableImageUpload = true,
  proseClassName = DEFAULT_PROSE,
}: MarkdownEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageMapRef = useRef<Record<string, string>>({});
  const counterRef = useRef(0);

  const [displayValue, setDisplayValue] = useState("");

  // Initialise (and re-sync) when the parent value changes externally
  // (e.g. form reset, loading a saved record).
  useEffect(() => {
    const { display, map, counter } = collapse(value);
    imageMapRef.current = map;
    counterRef.current = counter;
    setDisplayValue(display);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleDisplayChange = useCallback(
    (newDisplay: string) => {
      setDisplayValue(newDisplay);
      onChange(expand(newDisplay, imageMapRef.current));
    },
    [onChange],
  );

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

  return (
    <div>
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-4 mt-1">
        {/* Editor */}
        <div className="flex flex-col">
          <div className="flex gap-1 mb-1">
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
            className="w-full h-[360px] overflow-y-auto bg-secondary border border-border rounded-md px-3 py-2 text-sm font-mono resize-none"
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

        {/* Preview */}
        <div className="h-[360px] overflow-y-auto border border-border rounded-md px-4 py-3 bg-background">
          <article className={proseClassName}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform}>
              {previewMarkdown}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
