import { useQuery } from "@tanstack/react-query";
import { genealogyService, TreeFilters } from "@/services/genealogy";

export const useGenealogyTree = (filters: TreeFilters = {}) => {
  return useQuery({
    queryKey: ["genealogy-tree", filters],
    queryFn: () => genealogyService.getTree(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGenealogyProfessors = () => {
  return useQuery({
    queryKey: ["genealogy-professors"],
    queryFn: () => genealogyService.getProfessors(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGenealogyProfessor = (slug: string) => {
  return useQuery({
    queryKey: ["genealogy-professor", slug],
    queryFn: () => genealogyService.getProfessorDetail(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGenealogyStats = () => {
  return useQuery({
    queryKey: ["genealogy-stats"],
    queryFn: () => genealogyService.getStats(),
    staleTime: 5 * 60 * 1000,
  });
};
