export const normalizeSearchText = (value: string | number | null | undefined) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const matchesSearchTerm = (
  query: string,
  fields: Array<string | number | null | undefined>,
) => {
  const normalizedQuery = normalizeSearchText(query).trim();
  if (!normalizedQuery) return true;

  return fields.some((field) => normalizeSearchText(field).includes(normalizedQuery));
};
