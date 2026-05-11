import { api } from "@/lib/api";

export type ProfileTermKind = "research_area" | "skill" | "affiliation";
export type LabRelationshipType = "academic_advisor" | "usp_organization" | "external_organization";

export interface ProfileTerm {
  id: string;
  kind: ProfileTermKind;
  value: string;
  relationship_type?: LabRelationshipType | null;
}

export const profileTermsService = {
  list: (kind: ProfileTermKind, query = "", relationshipType?: string, limit = 12) => {
    const params = new URLSearchParams({ kind, query, limit: String(limit) });
    if (relationshipType) params.set("relationship_type", relationshipType);
    return api.get<ProfileTerm[]>(`/api/v1/profile-terms?${params.toString()}`);
  },
};
