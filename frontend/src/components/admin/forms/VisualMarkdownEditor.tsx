import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import {
  Bold, Code, Heading1, Heading2, Heading3, ImagePlus, Italic, Link2,
  List, ListChecks, ListOrdered, Minus, Quote, Redo2, Strikethrough,
  Table2, Undo2, Unlink, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadMedia } from "@/services/uploads";
import { visualMarkdownExtensions } from "./visualMarkdownExtensions";

interface Props {
  value: string;
  onChange: (value: string) => void;
  lang: "en" | "pt";
  enableImageUpload: boolean;
  proseClassName: string;
  label: string;
}

function Tool({ icon: Icon, label, active = false, disabled = false, onClick }: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant={active ? "secondary" : "ghost"} size="icon"
      className="h-9 w-9 shrink-0" title={label} aria-label={label} aria-pressed={active}
      disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick}>
      <Icon size={16} />
    </Button>
  );
}

export default function VisualMarkdownEditor({ value, onChange, lang, enableImageUpload, proseClassName, label }: Props) {
  const pt = lang === "pt";
  const lastEmitted = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = (markdown) => {
    lastEmitted.current = markdown;
    onChange(markdown);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageSelection = useRef<{ from: number; to: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: visualMarkdownExtensions,
    content: value,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: `${proseClassName} min-h-[320px] px-5 py-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 sm:px-8`,
        role: "textbox",
        "aria-label": label,
        "aria-multiline": "true",
      },
      handlePaste(view, event) {
        const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith("image/"));
        if (!file || !enableImageUpload) return false;
        imageSelection.current = { from: view.state.selection.from, to: view.state.selection.to };
        void uploadImage(file);
        return true;
      },
      handleDrop(view, event) {
        const file = Array.from(event.dataTransfer?.files ?? []).find((item) => item.type.startsWith("image/"));
        if (!file || !enableImageUpload) return false;
        imageSelection.current = { from: view.state.selection.from, to: view.state.selection.to };
        void uploadImage(file);
        return true;
      },
    },
    onUpdate: ({ editor: updated }) => onChangeRef.current(updated.getMarkdown()),
  });

  useEditorState({ editor, selector: ({ transactionNumber }) => transactionNumber });

  // React Hook Form may reset the field after the editor has mounted.
  useEffect(() => {
    if (editor && value !== editor.getMarkdown() && value !== lastEmitted.current) {
      editor.commands.setContent(value, { contentType: "markdown", emitUpdate: false });
    }
  }, [editor, value]);

  async function uploadImage(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const { key } = await uploadMedia(file, "markdown");
      if (!editor) return;
      const selection = imageSelection.current ?? editor.state.selection;
      editor.chain().focus().setTextSelection(selection).setImage({ src: key, alt: file.name.replace(/\.[^.]+$/, "") }).run();
      imageSelection.current = null;
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : (pt ? "Falha ao enviar imagem" : "Image upload failed"));
    } finally {
      setUploading(false);
    }
  }

  function applyLink() {
    if (!editor) return;
    const url = linkUrl.trim();
    if (url && !/^(https?:\/\/|mailto:|tel:|#|\/|\.\.?\/)/i.test(url)) {
      setLinkError(pt ? "Use https://, mailto: ou um caminho relativo." : "Use https://, mailto: or a relative path.");
      return;
    }
    if (!url) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else if (editor.state.selection.empty && !editor.isActive("link")) {
      editor.chain().focus().insertContent({ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] }).run();
    } else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkOpen(false);
    setLinkError("");
  }

  if (!editor) return <div className="min-h-[320px] animate-pulse rounded-lg border border-border bg-secondary/40" />;

  const tool = (icon: LucideIcon, en: string, ptLabel: string, onClick: () => void, active = false, disabled = false) => (
    <Tool icon={icon} label={pt ? ptLabel : en} onClick={onClick} active={active} disabled={disabled} />
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 p-2">
        {tool(Undo2, "Undo", "Desfazer", () => editor.chain().focus().undo().run(), false, !editor.can().undo())}
        {tool(Redo2, "Redo", "Refazer", () => editor.chain().focus().redo().run(), false, !editor.can().redo())}
        <span className="mx-1 h-5 w-px bg-border" />
        {tool(Heading1, "Heading 1", "Título 1", () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive("heading", { level: 1 }))}
        {tool(Heading2, "Heading 2", "Título 2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
        {tool(Heading3, "Heading 3", "Título 3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}
        <span className="mx-1 h-5 w-px bg-border" />
        {tool(Bold, "Bold", "Negrito", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
        {tool(Italic, "Italic", "Itálico", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
        {tool(Strikethrough, "Strikethrough", "Tachado", () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"))}
        {tool(Code, "Inline code", "Código em linha", () => editor.chain().focus().toggleCode().run(), editor.isActive("code"))}
        <span className="mx-1 h-5 w-px bg-border" />
        {tool(List, "Bullet list", "Lista com marcadores", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
        {tool(ListOrdered, "Numbered list", "Lista numerada", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
        {tool(ListChecks, "Task list", "Lista de tarefas", () => editor.chain().focus().toggleTaskList().run(), editor.isActive("taskList"))}
        {tool(Quote, "Quote", "Citação", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
        <span className="mx-1 h-5 w-px bg-border" />
        {tool(Link2, "Insert link", "Inserir link", () => {
          setLinkUrl(editor.getAttributes("link").href ?? "");
          setLinkError("");
          setLinkOpen((open) => !open);
        }, editor.isActive("link"))}
        {enableImageUpload && tool(ImagePlus, "Upload image", "Enviar imagem", () => {
          imageSelection.current = { from: editor.state.selection.from, to: editor.state.selection.to };
          fileInputRef.current?.click();
        }, false, uploading)}
        {tool(Code, "Code block", "Bloco de código", () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"))}
        {tool(Table2, "Insert table", "Inserir tabela", () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), editor.isActive("table"), editor.isActive("table"))}
        {tool(Minus, "Horizontal rule", "Linha divisória", () => editor.chain().focus().setHorizontalRule().run())}
      </div>

      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/20 p-3">
          <Input type="text" className="min-w-48 flex-1" aria-label={pt ? "Endereço do link" : "Link URL"}
            placeholder="https://example.com" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyLink(); } }} />
          <Button type="button" size="sm" onClick={applyLink}>{pt ? "Aplicar" : "Apply"}</Button>
          <Button type="button" variant="ghost" size="icon" aria-label={pt ? "Remover link" : "Remove link"}
            onClick={() => { editor.chain().focus().extendMarkRange("link").unsetLink().run(); setLinkOpen(false); }}><Unlink size={16} /></Button>
          <Button type="button" variant="ghost" size="icon" aria-label={pt ? "Fechar" : "Close"} onClick={() => setLinkOpen(false)}><X size={16} /></Button>
          {linkError && <p role="alert" className="w-full text-xs text-destructive">{linkError}</p>}
        </div>
      )}

      {editor.isActive("table") && (
        <div className="flex flex-wrap gap-1 border-b border-border bg-secondary/20 p-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().addRowAfter().run()}>{pt ? "+ Linha" : "+ Row"}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().addColumnAfter().run()}>{pt ? "+ Coluna" : "+ Column"}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteRow().run()}>{pt ? "Excluir linha" : "Delete row"}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteColumn().run()}>{pt ? "Excluir coluna" : "Delete column"}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteTable().run()}>{pt ? "Excluir tabela" : "Delete table"}</Button>
        </div>
      )}

      <EditorContent editor={editor} className="visual-markdown" />
      {uploading && <p className="px-4 pb-3 text-xs text-muted-foreground">{pt ? "Enviando imagem..." : "Uploading image..."}</p>}
      {uploadError && <p role="alert" className="px-4 pb-3 text-xs text-destructive">{uploadError}</p>}
      {enableImageUpload && <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void uploadImage(file);
        event.target.value = "";
      }} />}
    </div>
  );
}
