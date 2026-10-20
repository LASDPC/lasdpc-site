import { useMemo, useState } from "react";
import { GraduationCap, Search, Sprout, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { localizeResearchArea } from "@/lib/researchAreas";
import type { GenealogyEdge, GenealogyNode, ProfessorGenealogyCard } from "@/services/genealogy";

interface ProfessorGenealogyTreeProps {
  nodes: GenealogyNode[];
  edges: GenealogyEdge[];
  professor: ProfessorGenealogyCard;
  onSelectNode: (node: GenealogyNode) => void;
  isPt: boolean;
}

interface AdviseeRecord {
  node: GenealogyNode;
  qualifications: GenealogyEdge[];
  latestYear: number;
}

const sameQualification = (left: GenealogyEdge, right: GenealogyEdge) =>
  left.degree_code === right.degree_code
  && left.year === right.year
  && left.is_coorientation === right.is_coorientation
  && left.raw_code === right.raw_code;

export function ProfessorGenealogyTree({
  nodes,
  edges,
  professor,
  onSelectNode,
  isPt,
}: ProfessorGenealogyTreeProps) {
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const records = new Map<string, AdviseeRecord>();

    edges.forEach((edge) => {
      const node = nodeMap.get(edge.target);
      if (!node) return;
      const existing = records.get(node.id);
      if (!existing) {
        records.set(node.id, { node, qualifications: [edge], latestYear: edge.year || 0 });
        return;
      }
      if (!existing.qualifications.some((qualification) => sameQualification(qualification, edge))) {
        existing.qualifications.push(edge);
      }
      existing.latestYear = Math.max(existing.latestYear, edge.year || 0);
    });

    const query = search.trim().toLocaleLowerCase();
    const filtered = Array.from(records.values()).filter(({ node }) =>
      !query
      || node.name.toLocaleLowerCase().includes(query)
      || node.area?.toLocaleLowerCase().includes(query)
    );
    const sortRecords = (items: AdviseeRecord[]) => items.sort((left, right) =>
      right.latestYear - left.latestYear || left.node.name.localeCompare(right.node.name)
    );

    return [
      {
        id: "D",
        label: isPt ? "Doutorado" : "Doctorate",
        items: sortRecords(filtered.filter(({ qualifications }) =>
          qualifications.some((qualification) => qualification.degree_code === "D")
        )),
      },
      {
        id: "M",
        label: isPt ? "Mestrado" : "Master's",
        items: sortRecords(filtered.filter(({ qualifications }) =>
          !qualifications.some((qualification) => qualification.degree_code === "D")
          && qualifications.some((qualification) => qualification.degree_code === "M")
        )),
      },
      {
        id: "other",
        label: isPt ? "Outras orientações" : "Other supervision",
        items: sortRecords(filtered.filter(({ qualifications }) =>
          !qualifications.some((qualification) => ["D", "M"].includes(qualification.degree_code))
        )),
      },
    ].filter((group) => group.items.length > 0);
  }, [edges, isPt, nodes, search]);

  const totalAdvisees = new Set(edges.map((edge) => edge.target)).size;

  return (
    <div className="relative overflow-hidden">
      <div className="mb-8 flex justify-end">
        <label className="relative block w-full sm:w-72">
          <Search className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isPt ? "Buscar nesta árvore" : "Search this tree"}
            className="h-10 w-full border-0 border-b border-border bg-transparent pl-7 pr-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </label>
      </div>

      <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
        <div className="absolute left-1/2 top-5 h-28 w-28 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-[0_0_0_1px_hsl(var(--primary)/.35),0_14px_35px_hsl(var(--primary)/.2)] sm:h-24 sm:w-24">
          <GraduationCap size={34} strokeWidth={1.7} />
        </div>
        <p className="relative mt-4 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-primary">
          {isPt ? "Professor orientador" : "Faculty advisor"}
        </p>
        <h3 className="relative mt-1 text-balance font-display text-xl font-bold text-foreground sm:text-2xl">
          {professor.name}
        </h3>
        <p className="relative mt-1 text-xs text-muted-foreground">
          {totalAdvisees} {isPt ? "orientandos diretos" : "direct advisees"}
        </p>
      </div>

      <div className="mx-auto h-12 w-px bg-gradient-to-b from-primary to-primary/25" />

      {groups.length === 0 ? (
        <div className="border-y border-border py-12 text-center text-sm text-muted-foreground">
          {isPt ? "Nenhuma orientação corresponde à busca." : "No supervision relationship matches the search."}
        </div>
      ) : (
        <div className={`relative grid gap-x-12 gap-y-10 ${groups.length > 1 ? "lg:grid-cols-2" : "mx-auto max-w-3xl"}`}>
          <div className="absolute bottom-8 left-5 top-0 w-px bg-gradient-to-b from-primary/40 via-border to-transparent lg:hidden" />
          {groups.length > 1 ? (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 hidden h-20 w-full overflow-visible lg:block"
              viewBox="0 0 1000 80"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="genealogy-branch-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
                </linearGradient>
              </defs>
              <path d="M 500 0 C 500 38, 250 24, 250 80" fill="none" stroke="url(#genealogy-branch-gradient)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <path d="M 500 0 C 500 38, 750 24, 750 80" fill="none" stroke="url(#genealogy-branch-gradient)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          ) : (
            <div className="absolute left-1/2 top-0 hidden h-16 w-px -translate-x-1/2 bg-gradient-to-b from-primary/45 to-primary/15 lg:block" />
          )}
          {groups.map((group) => (
            <section key={group.id} className="relative pt-5 lg:pt-20">
              <div className="mb-5 flex items-center gap-3 lg:justify-center">
                <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-background text-white shadow-md ${group.id === "D" ? "bg-blue-500 shadow-blue-500/15" : "bg-emerald-500 shadow-emerald-500/15"}`}>
                  <Sprout size={18} />
                </span>
                <span>
                  <h4 className="font-display text-base font-bold text-foreground">{group.label}</h4>
                  <span className="font-mono text-[11px] text-muted-foreground">{group.items.length} {isPt ? "pessoas" : "people"}</span>
                </span>
              </div>

              <ul className="relative ml-5 before:pointer-events-none before:absolute before:bottom-5 before:left-0 before:top-2 before:w-px before:bg-gradient-to-b before:from-primary/25 before:via-border before:to-transparent">
                {group.items.map(({ node, qualifications }) => (
                  <li key={node.id} className="relative py-1.5 pl-5 before:absolute before:left-0 before:top-3 before:h-6 before:w-4 before:rounded-bl-xl before:border-b before:border-l before:border-border sm:pl-7 sm:before:w-6">
                    <button
                      type="button"
                      onClick={() => onSelectNode(node)}
                      className="group/person flex w-full min-w-0 items-center gap-3 rounded-r-xl border-b border-border/70 px-2 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/[0.035] sm:px-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/10 font-display text-[11px] font-bold text-primary sm:h-10 sm:w-10">
                        {node.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-foreground transition-colors group-hover/person:text-primary">
                            {node.name}
                          </span>
                          {node.is_docente && (
                            <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                              {isPt ? "Docente LaSDPC" : "LaSDPC faculty"}
                            </Badge>
                          )}
                        </span>
                        {node.area && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{localizeResearchArea(node.area, isPt)}</span>}
                        <span className="mt-1.5 flex flex-wrap gap-1.5">
                          {qualifications.map((qualification, index) => (
                            <Badge
                              key={`${qualification.raw_code || qualification.degree_code}-${qualification.year || "na"}-${qualification.is_coorientation}-${index}`}
                              variant="outline"
                              className={`px-1.5 py-0 text-[10px] ${
                                qualification.degree_code === "D"
                                  ? "border-blue-500/35 text-blue-600 dark:text-blue-400"
                                  : "border-emerald-500/35 text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {qualification.degree_code}
                              {qualification.year ? ` · ${qualification.year}` : ""}
                              {qualification.is_coorientation ? ` · ${isPt ? "coorientação" : "co-supervision"}` : ""}
                            </Badge>
                          ))}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="mt-10 flex items-center justify-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
        <Users size={14} />
        <span>{totalAdvisees} {isPt ? "pessoas nesta árvore" : "people in this tree"}</span>
      </div>
    </div>
  );
}
