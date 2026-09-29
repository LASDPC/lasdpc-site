import { buildDocTree, findDocFolder, normalizeFolderPath } from "@/lib/docTree";

describe("document folders", () => {
  it("shows persistent empty folders alongside folders inferred from documents", () => {
    const tree = buildDocTree(
      [{ id: "1", path: "meetings/2026/notes.md", content: "", updatedAt: "2026-09-29" }],
      [{ id: "2", path: "meetings/archive" }],
    );

    expect(findDocFolder(tree, "meetings/archive")?.files).toEqual([]);
    expect(findDocFolder(tree, "meetings/2026")?.files[0].path).toBe("meetings/2026/notes.md");
    expect(tree.folders[0].folders.map((folder) => folder.name)).toEqual(["2026", "archive"]);
  });

  it("rejects invalid folder names and normalizes nested paths", () => {
    expect(normalizeFolderPath(" meetings//2026 ")).toBe("meetings/2026");
    expect(normalizeFolderPath("meetings/../secret")).toBeNull();
  });
});
