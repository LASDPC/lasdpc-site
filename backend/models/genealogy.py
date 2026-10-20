from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class GenealogyMetrics(BaseModel):
    genealogical_index: int = Field(default=0, description="Índice Genealógico (Ig)")
    descendants_count: int = Field(default=0, description="Descendência Total (Ds)")
    fecundity: int = Field(default=0, description="Fecundidade: orientados diretos (Fc)")
    fertility: int = Field(default=0, description="Fertilidade: orientados com orientados (Ft)")
    generations: int = Field(default=0, description="Gerações acadêmicas (G)")
    relationships: int = Field(default=0, description="Relações na descendência (R)")
    cousins: int = Field(default=0, description="Primos acadêmicos (Pr)")


class GenealogyNode(BaseModel):
    id: str
    name: str
    slug: Optional[str] = None
    area: Optional[str] = None
    lattes_id: Optional[str] = None
    lattes_url: Optional[str] = None
    profile_url: Optional[str] = None
    is_docente: bool = False
    is_ancestor: bool = False
    is_lasdpc_member: bool = False
    lasdpc_user_id: Optional[str] = None
    lasdpc_role: Optional[str] = None
    avatar: Optional[str] = None
    generation: int = 1
    neighbors: int = 0
    metrics: Optional[dict[str, Any]] = None
    table_qualifications: Optional[list[dict[str, Any]]] = None


class GenealogyEdge(BaseModel):
    source: str
    target: str
    degree: str
    degree_code: str
    year: Optional[int] = None
    is_coorientation: bool = False
    raw_code: Optional[str] = None


class ProfessorGenealogyCard(BaseModel):
    slug: str
    name: str
    acacia_id: str
    title: Optional[str] = None
    titlePt: Optional[str] = None
    email: Optional[str] = None
    area: Optional[str] = None
    lattes_id: Optional[str] = None
    lattes_url: Optional[str] = None
    profile_url: Optional[str] = None
    metrics: GenealogyMetrics
    percentiles: Optional[dict[str, Any]] = None
    direct_advisees_count: int = 0
    areas: Optional[dict[str, Any]] = None
    timelines: Optional[dict[str, Any]] = None


class GenealogyStats(BaseModel):
    total_nodes: int = 0
    total_edges: int = 0
    total_docentes: int = 0
    masters_degrees: int = 0
    doctorate_degrees: int = 0
    coorientations: int = 0
    total_descendants_accumulated: int = 0
    direct_advisees_total: int = 0
    last_sync_utc: Optional[str] = None


class GenealogyTreeResponse(BaseModel):
    stats: GenealogyStats
    nodes: list[GenealogyNode]
    edges: list[GenealogyEdge]
    professors: list[ProfessorGenealogyCard]
