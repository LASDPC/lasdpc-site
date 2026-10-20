import { describe, it, expect, vi } from "vitest";
import { genealogyService } from "@/services/genealogy";

describe("Genealogy Service", () => {
  it("loads tree with static fallback data", async () => {
    const data = await genealogyService.getTree();
    expect(data).toBeDefined();
    expect(data.nodes.length).toBeGreaterThan(0);
    expect(data.edges.length).toBeGreaterThan(0);
    expect(data.professors.length).toBe(6);
    const facultyIds = new Set(data.professors.map((professor) => professor.acacia_id));
    expect(data.nodes.some((node) => node.is_ancestor || node.generation === 2)).toBe(false);
    expect(data.edges.every((edge) => facultyIds.has(String(edge.source)))).toBe(true);
  });

  it("filters tree for Julio Cezar Estrella", async () => {
    const data = await genealogyService.getTree({ professor: "julio-cezar-estrella" });
    expect(data).toBeDefined();
    expect(data.nodes.some((n) => n.slug === "julio-cezar-estrella")).toBe(true);
    expect(data.edges.every((edge) => edge.source === "971848")).toBe(true);
  });

  it("returns professors cards with valid topological metrics", async () => {
    const profs = await genealogyService.getProfessors();
    expect(profs).toHaveLength(6);
    const julio = profs.find((p) => p.slug === "julio-cezar-estrella");
    expect(julio).toBeDefined();
    expect(julio?.metrics.descendants_count).toBeGreaterThan(0);
    expect(julio?.metrics.fecundity).toBeGreaterThan(0);
  });
});
