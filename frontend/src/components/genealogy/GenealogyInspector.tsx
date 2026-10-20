import React from "react";
import { Link } from "react-router-dom";
import {
  X, ExternalLink, GraduationCap, Award, BookOpen, User,
  Calendar, Network, Share2, Info, ArrowUpRight, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { GenealogyNode, ProfessorGenealogyCard } from "@/services/genealogy";

interface GenealogyInspectorProps {
  node: GenealogyNode | null;
  professors: ProfessorGenealogyCard[];
  onClose: () => void;
  isPt: boolean;
}

export const GenealogyInspector: React.FC<GenealogyInspectorProps> = ({
  node,
  professors,
  onClose,
  isPt,
}) => {
  if (!node) return null;

  const profDetail = professors.find((p) => p.slug === node.slug || p.acacia_id === node.id);
  const metrics = profDetail?.metrics || node.metrics;

  const metricExplanations: Record<string, { titlePt: string; titleEn: string; descPt: string; descEn: string }> = {
    descendants_count: {
      titlePt: "Descendência (Ds)",
      titleEn: "Descendants (Ds)",
      descPt: "Número total de descendentes distintos formados em todas as gerações da linhagem.",
      descEn: "Total number of distinct academic descendants across all generations.",
    },
    genealogical_index: {
      titlePt: "Índice Genealógico (Ig)",
      titleEn: "Genealogical Index (Ig)",
      descPt: "Maior número g de descendentes diretos que possuem, cada um, pelo menos g descendentes diretos (análogo ao índice h).",
      descEn: "Highest number g of direct advisees who each have at least g direct advisees.",
    },
    fecundity: {
      titlePt: "Fecundidade (Fc)",
      titleEn: "Fecundity (Fc)",
      descPt: "Número de orientados diretos titulados (Mestrado, Doutorado e Pós-Doutorado).",
      descEn: "Number of direct advisees (MSc, PhD, and PostDocs).",
    },
    fertility: {
      titlePt: "Fertilidade (Ft)",
      titleEn: "Fertility (Ft)",
      descPt: "Número de orientados diretos que também formaram seus próprios descendentes acadêmicos.",
      descEn: "Number of direct advisees who themselves became academic advisors.",
    },
    generations: {
      titlePt: "Gerações (G)",
      titleEn: "Generations (G)",
      descPt: "Profundidade máxima de níveis na árvore genealógica de orientações.",
      descEn: "Maximum depth of academic generations in the tree.",
    },
    relationships: {
      titlePt: "Relações (R)",
      titleEn: "Relationships (R)",
      descPt: "Número total de vínculos de orientação registrados na descendência.",
      descEn: "Total number of supervision ties in the descent tree.",
    },
    cousins: {
      titlePt: "Primos (Pr)",
      titleEn: "Academic Cousins (Pr)",
      descPt: "Pesquisadores com orientadores diferentes que compartilham ao menos um avô acadêmico.",
      descEn: "Researchers with different advisors who share at least one academic grandparent.",
    },
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-6 border-b border-border/70 flex items-start justify-between bg-muted/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center font-display font-bold text-xl text-primary shrink-0 shadow-inner">
            {node.avatar ? (
              <img src={node.avatar} alt={node.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              node.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-foreground line-clamp-2 leading-tight">
              {node.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {node.is_docente && (
                <Badge className="bg-primary/90 text-primary-foreground text-[10px] py-0 px-2">
                  {isPt ? "Docente LaSDPC" : "Faculty Member"}
                </Badge>
              )}
              {node.is_ancestor && (
                <Badge variant="outline" className="border-amber-500/60 text-amber-500 text-[10px] py-0 px-2">
                  {isPt ? "Raiz Ancestral" : "Academic Ancestor"}
                </Badge>
              )}
              {node.generation === 2 && (
                <Badge variant="outline" className="border-cyan-500/60 text-cyan-500 text-[10px] py-0 px-2">
                  {isPt ? "2ª Geração" : "2nd Gen"}
                </Badge>
              )}
              {node.is_lasdpc_member && !node.is_docente && (
                <Badge variant="secondary" className="text-[10px] py-0 px-2 gap-1">
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  {isPt ? "Membro LaSDPC" : "LaSDPC Member"}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 rounded-full hover:bg-muted"
        >
          <X size={18} />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isPt ? "Informações Acadêmicas" : "Academic Information"}
          </h4>
          <div className="bg-muted/40 rounded-xl p-3.5 space-y-2 text-sm border border-border/50">
            {node.area && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{isPt ? "Área Principal:" : "Main Field:"}</span>
                <span className="font-medium text-foreground">{node.area}</span>
              </div>
            )}
            {node.table_qualifications && node.table_qualifications.length > 0 && (
              <div className="pt-2 border-t border-border/40">
                <span className="text-xs text-muted-foreground block mb-1.5">
                  {isPt ? "Titulações no LaSDPC:" : "Degrees in LaSDPC:"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {node.table_qualifications.map((q, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className={`text-xs ${
                        q.degree_code === "D"
                          ? "border-blue-500/50 text-blue-500"
                          : "border-emerald-500/50 text-emerald-500"
                      }`}
                    >
                      {q.degree} {q.year ? `(${q.year})` : ""} {q.is_coorientation ? "Co" : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Topological Metrics Section */}
        {metrics && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isPt ? "Métricas Topológicas da Genealogia" : "Topological Genealogy Metrics"}
              </h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={14} className="text-muted-foreground hover:text-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {isPt
                      ? "Métricas computadas pela Plataforma Acácia com base nos grafos de orientação da Plataforma Lattes."
                      : "Metrics computed by Plataforma Acácia based on Lattes mentorship graphs."}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: "descendants_count", value: metrics.descendants_count },
                { key: "genealogical_index", value: metrics.genealogical_index },
                { key: "fecundity", value: metrics.fecundity },
                { key: "fertility", value: metrics.fertility },
                { key: "generations", value: metrics.generations },
                { key: "relationships", value: metrics.relationships },
                { key: "cousins", value: metrics.cousins },
              ].map(({ key, value }) => {
                const info = metricExplanations[key];
                if (!info) return null;
                return (
                  <TooltipProvider key={key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-muted/40 rounded-xl p-3 border border-border/50 text-left hover:border-primary/40 transition-colors">
                          <span className="text-[11px] font-medium text-muted-foreground block line-clamp-1">
                            {isPt ? info.titlePt : info.titleEn}
                          </span>
                          <span className="font-display text-2xl font-bold text-foreground mt-0.5 block">
                            {value ?? 0}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        <p className="font-semibold">{isPt ? info.titlePt : info.titleEn}</p>
                        <p className="text-muted-foreground mt-1">{isPt ? info.descPt : info.descEn}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {node.lasdpc_user_id && (
            <Button asChild className="w-full gap-2 rounded-xl" variant="default">
              <Link to={`/profile/${node.lasdpc_user_id}`}>
                <User size={16} />
                <span>{isPt ? "Ver Perfil no LaSDPC" : "View LaSDPC Profile"}</span>
                <ArrowUpRight size={14} className="ml-auto" />
              </Link>
            </Button>
          )}

          {node.lattes_id && (
            <Button asChild className="w-full gap-2 rounded-xl" variant="outline">
              <a href={`http://lattes.cnpq.br/${node.lattes_id}`} target="_blank" rel="noopener noreferrer">
                <BookOpen size={16} />
                <span>{isPt ? "Currículo Lattes" : "Lattes Curriculum"}</span>
                <ExternalLink size={14} className="ml-auto" />
              </a>
            </Button>
          )}

          {node.slug && (
            <Button asChild className="w-full gap-2 rounded-xl" variant="outline">
              <a
                href={`https://plataforma-acacia.org/profile/${node.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Network size={16} />
                <span>{isPt ? "Perfil na Plataforma Acácia" : "Plataforma Acácia Profile"}</span>
                <ExternalLink size={14} className="ml-auto" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
