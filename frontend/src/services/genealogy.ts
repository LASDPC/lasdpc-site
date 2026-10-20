import { api } from "@/lib/api";
import staticGenealogyData from "@/data/genealogy_data.json";

export interface TopologicalMetrics {
  genealogical_index: number; // Ig
  descendants_count: number;  // Ds
  fecundity: number;          // Fc
  fertility: number;          // Ft
  generations: number;        // G
  relationships: number;      // R
  cousins: number;            // Pr
}

export interface QualificationItem {
  raw: string;
  degree: string;
  degree_code: string;
  year?: number | null;
  is_coorientation: boolean;
}

export interface GenealogyNode {
  id: string;
  name: string;
  slug?: string | null;
  area?: string | null;
  lattes_id?: string | null;
  lattes_url?: string | null;
  profile_url?: string | null;
  is_docente?: boolean;
  is_ancestor?: boolean;
  is_lasdpc_member?: boolean;
  lasdpc_user_id?: string | null;
  lasdpc_role?: string | null;
  avatar?: string | null;
  generation: number;
  neighbors?: number;
  metrics?: TopologicalMetrics | null;
  table_qualifications?: QualificationItem[] | null;
}

export interface GenealogyEdge {
  source: string;
  target: string;
  degree: string;
  degree_code: string;
  year?: number | null;
  is_coorientation: boolean;
  raw_code?: string | null;
}

export interface ProfessorGenealogyCard {
  slug: string;
  name: string;
  acacia_id: string;
  title?: string | null;
  titlePt?: string | null;
  email?: string | null;
  area?: string | null;
  lattes_id?: string | null;
  lattes_url?: string | null;
  profile_url?: string | null;
  metrics: TopologicalMetrics;
  percentiles?: Record<string, Record<string, number>> | null;
  direct_advisees_count: number;
  areas?: {
    asc_major?: Array<{ label: string; count: number; percent: number }>;
    asc_areas?: Array<{ label: string; count: number; percent: number }>;
    desc_major?: Array<{ label: string; count: number; percent: number }>;
    desc_areas?: Array<{ label: string; count: number; percent: number }>;
  } | null;
  timelines?: {
    asc_timeline?: { categories: string[]; series: Array<{ code: string; name: string; data: number[] }> };
    desc_timeline?: { categories: string[]; series: Array<{ code: string; name: string; data: number[] }> };
  } | null;
}

export interface GenealogyStats {
  total_nodes: number;
  total_edges: number;
  total_docentes: number;
  masters_degrees: number;
  doctorate_degrees: number;
  coorientations: number;
  total_descendants_accumulated: number;
  direct_advisees_total: number;
  last_sync_utc?: string | null;
}

export interface GenealogyTreeResponse {
  stats: GenealogyStats;
  nodes: GenealogyNode[];
  edges: GenealogyEdge[];
  professors: ProfessorGenealogyCard[];
}

type StaticGenealogyPayload = {
  meta?: GenealogyStats;
  stats?: GenealogyStats;
  nodes?: GenealogyNode[];
  edges?: GenealogyEdge[];
  professors?: ProfessorGenealogyCard[];
};

export interface TreeFilters {
  professor?: string;
  degree?: string;
  min_year?: number;
  max_depth?: number;
}

export const genealogyService = {
  getTree: async (filters: TreeFilters = {}): Promise<GenealogyTreeResponse> => {
    try {
      const query = new URLSearchParams();
      if (filters.professor) query.set("professor", filters.professor);
      if (filters.degree) query.set("degree", filters.degree);
      if (filters.min_year) query.set("min_year", String(filters.min_year));
      if (filters.max_depth) query.set("max_depth", String(filters.max_depth));

      const res = await api.get<GenealogyTreeResponse>(`/api/v1/genealogy/tree?${query.toString()}`);
      if (res && res.nodes && res.nodes.length > 0) return res;
    } catch {
      // Fallback seamlessly to bundled static data
    }

    return filterStaticTree(staticGenealogyData as unknown as GenealogyTreeResponse, filters);
  },

  getProfessors: async (): Promise<ProfessorGenealogyCard[]> => {
    try {
      const res = await api.get<ProfessorGenealogyCard[]>("/api/v1/genealogy/professors");
      if (res && res.length > 0) return res;
    } catch {
      // Fallback
    }
    const data = staticGenealogyData as unknown as { professors: ProfessorGenealogyCard[] };
    return data.professors || [];
  },

  getProfessorDetail: async (slug: string): Promise<ProfessorGenealogyCard | undefined> => {
    try {
      return await api.get<ProfessorGenealogyCard>(`/api/v1/genealogy/professor/${slug}`);
    } catch {
      const data = staticGenealogyData as unknown as { professors: ProfessorGenealogyCard[] };
      return data.professors?.find((p) => p.slug === slug);
    }
  },

  getStats: async (): Promise<GenealogyStats> => {
    try {
      return await api.get<GenealogyStats>("/api/v1/genealogy/stats");
    } catch {
      return filterStaticTree(staticGenealogyData as unknown as GenealogyTreeResponse, {}).stats;
    }
  },

  triggerSync: async () => {
    return api.post("/api/v1/genealogy/sync", {});
  },
};

function filterStaticTree(tree: StaticGenealogyPayload, filters: TreeFilters): GenealogyTreeResponse {
  const allNodes = [...(tree.nodes || [])];
  const allEdges = [...(tree.edges || [])];
  const allProfessors = [...(tree.professors || [])];
  const professors = filters.professor
    ? allProfessors.filter((professor) => professor.slug === filters.professor)
    : allProfessors;
  const rootIds = new Set(professors.map((professor) => String(professor.acacia_id)));

  // The public tree intentionally contains only faculty plus one generation
  // of direct advisees. Full-lineage metrics remain available on profiles.
  const edges = allEdges.filter((edge) => {
    if (!rootIds.has(String(edge.source))) return false;
    if (filters.degree && edge.degree_code !== filters.degree.toUpperCase()) return false;
    if (filters.min_year && edge.year && edge.year < filters.min_year) return false;
    return true;
  });
  const visibleIds = new Set<string>(rootIds);
  edges.forEach((edge) => visibleIds.add(String(edge.target)));
  const nodes = allNodes.filter((node) => visibleIds.has(String(node.id)));
  const directRelationships = new Set(edges.map((edge) => `${edge.source}:${edge.target}`)).size;
  const stats: GenealogyStats = {
    total_nodes: nodes.length,
    total_edges: edges.length,
    total_docentes: professors.length,
    masters_degrees: edges.filter((edge) => edge.degree_code === "M").length,
    doctorate_degrees: edges.filter((edge) => edge.degree_code === "D").length,
    coorientations: edges.filter((edge) => edge.is_coorientation).length,
    total_descendants_accumulated: directRelationships,
    direct_advisees_total: directRelationships,
    last_sync_utc: tree.meta?.last_sync_utc,
  };

  return {
    stats,
    nodes,
    edges,
    professors,
  };
}
