import { Editor } from "@tiptap/react";
import { visualMarkdownExtensions } from "@/components/admin/forms/visualMarkdownExtensions";

describe("visual Markdown editing", () => {
  it("keeps existing Markdown content and image keys when formatting text", () => {
    const editor = new Editor({
      extensions: visualMarkdownExtensions,
      contentType: "markdown",
      content: "## Research\n\nA **result** with [details](https://example.com).\n\n![Diagram](markdown/diagram.png)",
    });

    editor.commands.setTextSelection(1);
    editor.chain().focus().insertContent("New ").run();
    const markdown = editor.getMarkdown();

    expect(markdown).toContain("## New Research");
    expect(markdown).toContain("**result**");
    expect(markdown).toContain("[details](https://example.com)");
    expect(markdown).toContain("![Diagram](markdown/diagram.png)");
    editor.destroy();
  });

  it("writes a table and task list in Markdown", () => {
    const editor = new Editor({ extensions: visualMarkdownExtensions, content: "Notes" });
    editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run();
    editor.chain().focus().insertContentAt(editor.state.doc.content.size, "\nTasks").run();
    editor.chain().focus().toggleTaskList().run();

    const markdown = editor.getMarkdown();
    expect(markdown).toContain("| ");
    expect(markdown).toContain("- [ ]");
    editor.destroy();
  });

  it("keeps code fences inside code blocks intact", () => {
    const editor = new Editor({
      extensions: visualMarkdownExtensions,
      contentType: "markdown",
      content: "````js\nconsole.log('```')\n````",
    });

    const markdown = editor.getMarkdown();
    expect(markdown).toContain("console.log('```')");
    expect(markdown).toMatch(/^`{4,}js/m);
    editor.destroy();
  });
});
