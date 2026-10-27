import type { User } from "@/services/auth";

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  // Keep spreadsheet applications from treating profile text as a formula.
  const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

export function buildPeopleCsv(people: User[], isPt: boolean) {
  const namesById = new Map(people.map((person) => [person.id, person.name]));
  const headers = isPt
    ? ["Nome completo", "Data de entrada", "Data de saída", "Orientador"]
    : ["Full name", "Entry date", "Exit date", "Advisor"];
  const rows = [...people]
    .sort((a, b) => a.name.localeCompare(b.name, isPt ? "pt-BR" : "en-US"))
    .map((person) => {
      const exitDate = person.exit_date || person.graduation_year;
      return [
        person.name,
        person.year_joined,
        isPt && typeof exitDate === "string"
          ? exitDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3/$2/$1")
          : exitDate,
        (person.advisor_id && namesById.get(person.advisor_id)) || person.advisor_name,
      ];
    });

  // UTF-8 BOM preserves accented names when opening the file in Excel.
  return "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadPeopleCsv(people: User[], isPt: boolean) {
  const blob = new Blob([buildPeopleCsv(people, isPt)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lasdpc-pessoas.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
