import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPeopleCsv, downloadPeopleCsv } from "@/lib/peopleCsv";
import type { User } from "@/services/auth";

const person = (overrides: Partial<User>): User => ({
  id: "student", name: "Ana Silva", email: "ana@example.com", initials: "AS",
  role: "aluno_ativo", is_admin: false, ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("people CSV", () => {
  it("exports faculty, students and alumni with dates and resolved advisor names", () => {
    const people = [
      person({ id: "faculty", name: "José Costa", role: "docente" }),
      person({ year_joined: 2020, exit_date: "2024-03-15", role: "alumni", advisor_id: "faculty", advisor_name: "Old name" }),
      person({ id: "other", name: "Beatriz Lima", advisor_name: "External advisor", graduation_year: 2023 }),
    ];
    expect(buildPeopleCsv(people, true)).toBe(
      '\uFEFF"Nome completo","Data de entrada","Data de saída","Orientador"\r\n' +
      '"Ana Silva","2020","15/03/2024","José Costa"\r\n' +
      '"Beatriz Lima","","2023","External advisor"\r\n' +
      '"José Costa","","",""',
    );
    expect(people[0].id).toBe("faculty");
  });

  it("preserves commas, quotes, newlines and accents without leaking other profile fields", () => {
    const csv = buildPeopleCsv([person({ name: 'João, "Silva"\nJúnior' })], false);
    expect(csv).toContain('"Full name","Entry date","Exit date","Advisor"');
    expect(csv).toContain('"João, ""Silva""\nJúnior","","",""');
    expect(csv).not.toContain("ana@example.com");
  });

  it("keeps profile text from becoming spreadsheet formulas", () => {
    const csv = buildPeopleCsv([person({ name: '=HYPERLINK("url")', advisor_name: "  +SUM(1,2)" })], false);
    expect(csv).toContain('"\'=HYPERLINK(""url"")"');
    expect(csv).toContain('"\'  +SUM(1,2)"');
  });

  it("downloads a UTF-8 CSV and releases the temporary URL", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:people");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      expect(this.download).toBe("lasdpc-pessoas.csv");
      expect(this.getAttribute("href")).toBe("blob:people");
      expect(document.body.contains(this)).toBe(true);
    });

    downloadPeopleCsv([person({})], true);

    expect(click).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0][0]).toHaveProperty("type", "text/csv;charset=utf-8;");
    expect(document.querySelector('a[download="lasdpc-pessoas.csv"]')).toBeNull();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:people");
  });
});
