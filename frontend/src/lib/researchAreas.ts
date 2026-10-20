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

const RESEARCH_AREA_TRANSLATIONS: Record<string, { en: string; pt: string }> = {
  "artificial intelligence": { en: "Artificial Intelligence", pt: "Inteligência Artificial" },
  "inteligencia artificial": { en: "Artificial Intelligence", pt: "Inteligência Artificial" },
  "cloud computing": { en: "Cloud Computing", pt: "Computação em Nuvem" },
  "computacao em nuvem": { en: "Cloud Computing", pt: "Computação em Nuvem" },
  "computer engineering": { en: "Computer Engineering", pt: "Engenharia de Computação" },
  "engenharia de computacao": { en: "Computer Engineering", pt: "Engenharia de Computação" },
  "computer science": { en: "Computer Science", pt: "Ciência da Computação" },
  "ciencia da computacao": { en: "Computer Science", pt: "Ciência da Computação" },
  "computer systems": { en: "Computer Systems", pt: "Sistemas de Computação" },
  "sistemas de computacao": { en: "Computer Systems", pt: "Sistemas de Computação" },
  "concurrent programming": { en: "Concurrent Programming", pt: "Programação Concorrente" },
  "programacao concorrente": { en: "Concurrent Programming", pt: "Programação Concorrente" },
  "distributed systems": { en: "Distributed Systems", pt: "Sistemas Distribuídos" },
  "sistemas distribuidos": { en: "Distributed Systems", pt: "Sistemas Distribuídos" },
  "high-performance computing": { en: "High-Performance Computing", pt: "Computação de Alto Desempenho" },
  "computacao de alto desempenho": { en: "High-Performance Computing", pt: "Computação de Alto Desempenho" },
  "machine learning": { en: "Machine Learning", pt: "Aprendizado de Máquina" },
  "aprendizado de maquina": { en: "Machine Learning", pt: "Aprendizado de Máquina" },
  observability: { en: "Observability", pt: "Observabilidade" },
  observabilidade: { en: "Observability", pt: "Observabilidade" },
  "operating systems": { en: "Operating Systems", pt: "Sistemas Operacionais" },
  "sistemas operacionais": { en: "Operating Systems", pt: "Sistemas Operacionais" },
  "performance evaluation": { en: "Performance Evaluation", pt: "Avaliação de Desempenho" },
  "avaliacao de desempenho": { en: "Performance Evaluation", pt: "Avaliação de Desempenho" },
  "process scheduling": { en: "Process Scheduling", pt: "Escalonamento de Processos" },
  "escalonamento de processos": { en: "Process Scheduling", pt: "Escalonamento de Processos" },
  "resource management": { en: "Resource Management", pt: "Gerenciamento de Recursos" },
  "gerenciamento de recursos": { en: "Resource Management", pt: "Gerenciamento de Recursos" },
  scheduling: { en: "Scheduling", pt: "Escalonamento" },
  escalonamento: { en: "Scheduling", pt: "Escalonamento" },
  "service-oriented architectures": { en: "Service-Oriented Architectures", pt: "Arquiteturas Orientadas a Serviço" },
  "arquiteturas orientadas a servico": { en: "Service-Oriented Architectures", pt: "Arquiteturas Orientadas a Serviço" },
  "software testing": { en: "Software Testing", pt: "Teste de Software" },
  "teste de software": { en: "Software Testing", pt: "Teste de Software" },
};

export const localizeResearchArea = (value: string, isPt: boolean) =>
  value
    .split(",")
    .map((part) => {
      const clean = part.trim();
      const translation = RESEARCH_AREA_TRANSLATIONS[normalizeResearchArea(clean)];
      return translation?.[isPt ? "pt" : "en"] || clean;
    })
    .join(", ");
