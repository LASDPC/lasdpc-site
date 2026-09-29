import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import CodeBlock from "@tiptap/extension-code-block";
import { mediaUrl } from "@/lib/media";

// Save image object keys in Markdown while showing the public URL in the editor.
const EditorImage = Image.extend({
  addNodeView() {
    return ({ node }) => {
      const img = document.createElement("img");
      img.src = mediaUrl(node.attrs.src) ?? "";
      img.alt = node.attrs.alt ?? "";
      if (node.attrs.title) img.title = node.attrs.title;
      return { dom: img };
    };
  },
});

const SafeCodeBlock = CodeBlock.extend({
  renderMarkdown(node, helpers) {
    const code = helpers.renderChildren(node.content ?? []);
    const longestRun = Math.max(2, ...Array.from(code.matchAll(/`+/g), (match) => match[0].length));
    const fence = "`".repeat(longestRun + 1);
    return `${fence}${node.attrs?.language || ""}\n${code}\n${fence}`;
  },
});

export const visualMarkdownExtensions = [
  StarterKit.configure({ codeBlock: false, link: { openOnClick: false }, underline: false }),
  Markdown,
  SafeCodeBlock,
  EditorImage,
  TableKit,
  TaskList,
  TaskItem.configure({ nested: true }),
];
