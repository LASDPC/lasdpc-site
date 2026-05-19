export const CLASSIC_RESEARCH_AREAS = [
  "Artificial Intelligence",
  "Cloud Computing",
  "Concurrent Programming",
  "Distributed Systems",
  "High-Performance Computing",
  "Machine Learning",
  "Observability",
  "Operating Systems",
  "Performance Evaluation",
  "Resource Management",
  "Scheduling",
  "Software Testing",
];

export const normalizeResearchArea = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase();
