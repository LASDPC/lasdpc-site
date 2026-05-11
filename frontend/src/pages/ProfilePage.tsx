import { useMemo, useRef, useState } from "react";
import type React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDocentes, useStudents, useUser } from "@/hooks/usePeople";
import { peopleService } from "@/services/people";
import type { User } from "@/services/auth";
import { uploadProfilePhoto } from "@/services/uploads";
import AffiliationInput from "@/components/profile/AffiliationInput";
import ProfileTermPicker from "@/components/profile/ProfileTermPicker";
import {
  Mail, ExternalLink, Camera, GraduationCap, BookOpen, User as UserIcon,
  Linkedin, Github, Twitter, Pencil, Save, XCircle, Plus,
  X, Check, Link2, CalendarDays, Briefcase, Search, Sparkles, Settings,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const ROLE_LABELS: Record<string, { en: string; pt: string }> = {
  docente: { en: "Faculty", pt: "Docente" },
  aluno_ativo: { en: "Active Student", pt: "Aluno Ativo" },
  alumni: { en: "Alumni", pt: "Egresso" },
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  docente: <BookOpen size={16} />,
  aluno_ativo: <GraduationCap size={16} />,
  alumni: <UserIcon size={16} />,
};

const EDITABLE_FIELDS = [
  "name", "bio", "bioPt", "title", "titlePt", "area", "areaPt",
  "level", "levelPt", "year_joined", "graduation_year",
  "skills", "research_areas",
  "linkedin", "github", "twitter", "researchgate", "lattes", "orcid", "scholar", "page",
  "lab_relationship_type", "affiliation_name",
] as const;

const DEFAULT_RESEARCH_AREAS = [
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

const SOCIAL_LINKS = [
  { key: "lattes", label: "Lattes", icon: ExternalLink },
  { key: "orcid", label: "ORCID", icon: ExternalLink },
  { key: "scholar", label: "Google Scholar", icon: ExternalLink },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "github", label: "GitHub", icon: Github },
  { key: "twitter", label: "Twitter / X", icon: Twitter },
  { key: "researchgate", label: "ResearchGate", icon: ExternalLink },
  { key: "page", label: "Personal page", icon: Link2 },
] as const;

const LAB_RELATIONSHIP_LABELS: Record<string, { en: string; pt: string }> = {
  academic_advisor: { en: "Academic advisor", pt: "Orientador acadêmico" },
  usp_organization: { en: "USP organization", pt: "Organização da USP" },
  external_organization: { en: "External organization", pt: "Organização externa" },
};

const uniqueSorted = (items: Array<string | null | undefined>) =>
  Array.from(new Set(items.map((item) => item?.trim()).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

const normalize = (value: string) => value.trim().toLocaleLowerCase();

const stringValue = (value: unknown) => (typeof value === "string" ? value : "");

const listValue = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

const ProfilePageSkeleton = () => (
  <div className="py-10">
    <div className="container mx-auto px-4 max-w-5xl">
      <Skeleton className="h-44 rounded-lg" />
      <div className="-mt-12 flex items-end gap-6 px-6">
        <Skeleton className="w-28 h-28 rounded-full shrink-0" />
        <div className="flex-1 space-y-3 pb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  </div>
);

type EditableTextProps = {
  value?: string | null;
  draftValue: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
};

const EditableText = ({
  value,
  draftValue,
  isEditing,
  onChange,
  placeholder,
  className = "",
  inputClassName = "",
  multiline = false,
}: EditableTextProps) => {
  if (isEditing) {
    if (multiline) {
      return (
        <Textarea
          value={draftValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`min-h-[116px] resize-none ${inputClassName}`}
        />
      );
    }

    return (
      <Input
        value={draftValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClassName}
      />
    );
  }

  if (!value) return null;
  return <p className={className}>{value}</p>;
};

type ResearchAreaPickerProps = {
  selected: string[];
  options: string[];
  isPt: boolean;
  onChange: (areas: string[]) => void;
};

const ResearchAreaPicker = ({ selected, options, isPt, onChange }: ResearchAreaPickerProps) => {
  const [query, setQuery] = useState("");
  const [customArea, setCustomArea] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  const selectedKeys = useMemo(() => new Set(selected.map(normalize)), [selected]);
  const filteredOptions = useMemo(() => {
    const q = normalize(query);
    return options.filter((area) => !selectedKeys.has(normalize(area)) && (!q || normalize(area).includes(q))).slice(0, 12);
  }, [options, query, selectedKeys]);

  const addArea = (area: string) => {
    const cleanArea = area.trim();
    if (!cleanArea || selectedKeys.has(normalize(cleanArea))) return;
    onChange([...selected, cleanArea]);
    setQuery("");
    setCustomArea("");
    setAddingCustom(false);
  };

  const removeArea = (area: string) => {
    onChange(selected.filter((item) => normalize(item) !== normalize(area)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selected.length > 0 ? (
          selected.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => removeArea(area)}
              className="inline-flex min-h-8 items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
            >
              {area}
              <X size={13} />
            </button>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">
            {isPt ? "Nenhuma area selecionada ainda." : "No areas selected yet."}
          </span>
        )}
      </div>

      <div className="rounded-lg border border-border bg-secondary/35 p-3">
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isPt ? "Buscar area existente" : "Search existing area"}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filteredOptions.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => addArea(area)}
              className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus size={13} />
              {area}
            </button>
          ))}
          {filteredOptions.length === 0 && (
            <span className="text-xs text-muted-foreground">
              {isPt ? "Nenhuma sugestao encontrada." : "No matching suggestions."}
            </span>
          )}
        </div>

        <div className="mt-3 border-t border-border pt-3">
          {addingCustom ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={customArea}
                onChange={(event) => setCustomArea(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addArea(customArea);
                  }
                }}
                placeholder={isPt ? "Nova area de pesquisa" : "New research area"}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => addArea(customArea)} className="shrink-0">
                  <Check size={14} className="mr-2" />
                  {isPt ? "Adicionar" : "Add"}
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setAddingCustom(false)} aria-label={isPt ? "Cancelar" : "Cancel"}>
                  <X size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setAddingCustom(true)}>
              <Plus size={14} className="mr-2" />
              {isPt ? "Adicionar nova area" : "Add new area"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { lang, t } = useLang();
  const { user: currentUser } = useAuth();
  const isPt = lang === "pt-BR";
  const { data: profile, isLoading } = useUser(userId || "");
  const { data: docentes = [] } = useDocentes();
  const { data: students = [] } = useStudents();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  const globalResearchAreas = useMemo(() => {
    const people = [...docentes, ...students];
    return uniqueSorted([
      ...DEFAULT_RESEARCH_AREAS,
      ...people.flatMap((person) => [
        person.area,
        person.areaPt,
        ...(person.research_areas ?? []),
      ]),
    ]);
  }, [docentes, students]);

  if (isLoading) return <ProfilePageSkeleton />;
  if (!profile) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">{isPt ? "Usuario nao encontrado" : "User not found"}</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const roleLabel = ROLE_LABELS[profile.role]?.[isPt ? "pt" : "en"] ?? profile.role;
  const roleIcon = ROLE_ICONS[profile.role];
  const visibleTitle = isPt ? profile.titlePt || profile.title : profile.title || profile.titlePt;
  const visibleArea = isPt ? profile.areaPt || profile.area : profile.area || profile.areaPt;
  const visibleLevel = isPt ? profile.levelPt || profile.level : profile.level || profile.levelPt;
  const visibleBio = isPt ? profile.bioPt || profile.bio : profile.bio || profile.bioPt;
  const visibleRelationship = profile.lab_relationship_type
    ? LAB_RELATIONSHIP_LABELS[profile.lab_relationship_type]?.[isPt ? "pt" : "en"] ?? profile.lab_relationship_type
    : "";
  const selectedResearchAreas = listValue(draft.research_areas);
  const selectedSkills = listValue(draft.skills);
  const hasBio = visibleBio || (isEditing && isOwnProfile);
  const hasResearchAreas = (profile.research_areas && profile.research_areas.length > 0) || (isEditing && isOwnProfile);
  const hasSkills = (profile.skills && profile.skills.length > 0) || (isEditing && isOwnProfile);
  const pageTitlePlaceholder = isPt ? "Cargo ou titulo" : "Role or title";
  const areaPlaceholder = isPt ? "Area principal" : "Main area";
  const levelPlaceholder = isPt ? "Nivel academico" : "Academic level";

  const navigateToPeopleFilter = (key: string, value: string) => {
    navigate(`/people?${key}=${encodeURIComponent(value)}`);
  };

  const startEditing = () => {
    const nextDraft: Record<string, unknown> = {};
    for (const key of EDITABLE_FIELDS) {
      nextDraft[key] = (profile as Record<string, unknown>)[key] ?? (key === "skills" || key === "research_areas" ? [] : "");
    }
    setDraft(nextDraft);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft({});
    setIsEditing(false);
  };

  const updateDraft = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateLocalizedDraft = (baseKey: "title" | "area" | "level" | "bio", value: string) => {
    const ptKey = `${baseKey}Pt`;
    if (isPt) {
      setDraft((prev) => ({
        ...prev,
        [ptKey]: value,
        [baseKey]: stringValue(prev[baseKey]) || value,
      }));
      return;
    }

    setDraft((prev) => ({
      ...prev,
      [baseKey]: value,
      [ptKey]: stringValue(prev[ptKey]) || value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<User> = {};
      for (const key of EDITABLE_FIELDS) {
        (payload as Record<string, unknown>)[key] = draft[key] ?? null;
      }
      if (payload.year_joined === "" || payload.year_joined === 0) payload.year_joined = null;
      if (payload.graduation_year === "" || payload.graduation_year === 0) payload.graduation_year = null;
      payload.research_areas = uniqueSorted(listValue(payload.research_areas));
      payload.skills = uniqueSorted(listValue(payload.skills));

      const requiredFields = ["lattes", "orcid", "scholar", "github", "lab_relationship_type", "affiliation_name"] as const;
      const missingRequired = requiredFields.some((key) => !stringValue((payload as Record<string, unknown>)[key]).trim());
      if (!profile.photo || missingRequired) {
        toast.error(isPt ? "Complete foto, links obrigatorios, relacao com o lab e afiliacao." : "Complete photo, required links, lab relationship, and affiliation.");
        return;
      }

      await peopleService.updateUser(profile.id, payload);
      queryClient.invalidateQueries({ queryKey: ["user", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(isPt ? "Perfil atualizado!" : "Profile updated!");
      setIsEditing(false);
      setDraft({});
    } catch {
      toast.error(isPt ? "Erro ao salvar perfil" : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error(isPt ? "Apenas JPG/PNG sao permitidos" : "Only JPG/PNG images are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(isPt ? "Arquivo deve ter no maximo 2 MB" : "File must be under 2 MB");
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadProfilePhoto(file);

      await peopleService.updateUser(profile.id, { photo: url });
      queryClient.invalidateQueries({ queryKey: ["user", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(isPt ? "Foto atualizada!" : "Photo updated!");
    } catch {
      toast.error(isPt ? "Erro ao fazer upload" : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addSkill = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue || selectedSkills.some((skill) => normalize(skill) === normalize(cleanValue))) return;
    updateDraft("skills", [...selectedSkills, cleanValue]);
  };

  const removeSkill = (value: string) => {
    updateDraft("skills", selectedSkills.filter((skill) => normalize(skill) !== normalize(value)));
  };

  const profileCompletion = [
    Boolean(profile.photo),
    Boolean(profile.bio || profile.bioPt),
    Boolean(profile.research_areas?.length),
    Boolean(profile.lattes || profile.orcid || profile.scholar || profile.linkedin || profile.github || profile.page),
  ].filter(Boolean).length;

  return (
    <div className="py-8">
      <div className="container mx-auto max-w-5xl px-4">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="h-40 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_28%),linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent))_52%,hsl(var(--secondary)))] sm:h-48" />
          <div className="px-4 pb-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative -mt-14 w-fit shrink-0 sm:-mt-16">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={profile.name}
                    className="h-28 w-28 rounded-full border-4 border-card object-cover shadow-sm sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-card bg-primary text-3xl font-bold text-primary-foreground shadow-sm sm:h-32 sm:w-32">
                    {profile.initials}
                  </div>
                )}
                {isOwnProfile && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-secondary"
                      aria-label={isPt ? "Alterar foto" : "Change photo"}
                    >
                      <Camera size={17} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              <div className="min-w-0 flex-1 pt-1 sm:pt-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-2">
                    {isEditing ? (
                      <Input
                        value={stringValue(draft.name)}
                        onChange={(event) => updateDraft("name", event.target.value)}
                        placeholder={isPt ? "Nome" : "Name"}
                        className="h-auto border-0 bg-secondary px-3 py-2 text-2xl font-bold shadow-none sm:text-3xl"
                      />
                    ) : (
                      <h1 className="break-words text-2xl font-bold text-foreground sm:text-3xl">{profile.name}</h1>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        {roleIcon}
                        {roleLabel}
                      </span>
                      {profile.affiliation_name && visibleRelationship && !isEditing && (
                        <span className="inline-flex items-center gap-2">
                          <Briefcase size={14} />
                          {visibleRelationship}: {profile.affiliation_name}
                        </span>
                      )}
                      {profile.is_admin && (
                        <Badge variant="secondary" className="rounded-full">Admin</Badge>
                      )}
                    </div>

                    <EditableText
                      value={visibleTitle}
                      draftValue={isPt ? stringValue(draft.titlePt) : stringValue(draft.title)}
                      isEditing={isEditing}
                      onChange={(value) => updateLocalizedDraft("title", value)}
                      placeholder={pageTitlePlaceholder}
                      className="text-sm font-medium text-foreground"
                      inputClassName="max-w-xl"
                    />

                    {isEditing ? (
                      <div className="flex max-w-xl flex-col gap-2 sm:flex-row">
                        <Input
                          list="profile-area-options"
                          value={isPt ? stringValue(draft.areaPt) : stringValue(draft.area)}
                          onChange={(event) => updateLocalizedDraft("area", event.target.value)}
                          placeholder={areaPlaceholder}
                        />
                        <datalist id="profile-area-options">
                          {globalResearchAreas.map((area) => (
                            <option key={area} value={area} />
                          ))}
                        </datalist>
                      </div>
                    ) : visibleArea ? (
                      <button
                        type="button"
                        onClick={() => navigateToPeopleFilter("area", visibleArea)}
                        className="text-left text-sm font-medium text-accent transition-colors hover:text-primary"
                        title={isPt ? `Ver todos com "${visibleArea}"` : `View all with "${visibleArea}"`}
                      >
                        {visibleArea}
                      </button>
                    ) : null}

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {isEditing && profile.role !== "docente" ? (
                        <Input
                          value={isPt ? stringValue(draft.levelPt) : stringValue(draft.level)}
                          onChange={(event) => updateLocalizedDraft("level", event.target.value)}
                          placeholder={levelPlaceholder}
                          className="h-9 max-w-56"
                        />
                      ) : visibleLevel ? (
                        <button
                          type="button"
                          onClick={() => navigateToPeopleFilter("level", visibleLevel)}
                          className="inline-flex min-h-7 items-center gap-1 rounded-full border border-border px-2.5 py-1 transition-colors hover:text-primary"
                        >
                          <GraduationCap size={13} />
                          {visibleLevel}
                        </button>
                      ) : null}

                      {isEditing ? (
                        <>
                          <Input
                            type="number"
                            value={draft.year_joined === undefined ? "" : String(draft.year_joined)}
                            onChange={(event) => updateDraft("year_joined", event.target.value ? Number(event.target.value) : "")}
                            placeholder={isPt ? "Ano de ingresso" : "Year joined"}
                            className="h-9 max-w-44"
                          />
                          {profile.role === "alumni" && (
                            <Input
                              type="number"
                              value={draft.graduation_year === undefined ? "" : String(draft.graduation_year)}
                              onChange={(event) => updateDraft("graduation_year", event.target.value ? Number(event.target.value) : "")}
                              placeholder={isPt ? "Ano de formatura" : "Graduation year"}
                              className="h-9 max-w-44"
                            />
                          )}
                        </>
                      ) : (
                        <>
                          {profile.year_joined && (
                            <button
                              type="button"
                              onClick={() => navigateToPeopleFilter("year", String(profile.year_joined))}
                              className="inline-flex min-h-7 items-center gap-1 rounded-full border border-border px-2.5 py-1 transition-colors hover:text-primary"
                            >
                              <CalendarDays size={13} />
                              {isPt ? `Desde ${profile.year_joined}` : `Since ${profile.year_joined}`}
                            </button>
                          )}
                          {profile.graduation_year && profile.role === "alumni" && (
                            <span className="inline-flex min-h-7 items-center gap-1 rounded-full border border-border px-2.5 py-1">
                              <CalendarDays size={13} />
                              {isPt ? `Formado em ${profile.graduation_year}` : `Graduated ${profile.graduation_year}`}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {isOwnProfile && (
                    <div className="flex shrink-0 gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={handleSave} disabled={saving}>
                            <Save size={14} className="mr-2" />
                            {saving ? (isPt ? "Salvando..." : "Saving...") : t("profile.save")}
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelEditing} disabled={saving}>
                            <XCircle size={14} className="mr-2" />
                            {t("profile.cancel")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={startEditing}>
                            <Pencil size={14} className="mr-2" />
                            {t("profile.edit")}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} aria-label={t("menu.settings")}>
                            <Settings size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-6">
            {hasBio && (
              <section className="rounded-lg border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-foreground">{t("people.bio")}</h2>
                  {isEditing && <Badge variant="outline" className="rounded-full">{isPt ? "Editando no lugar" : "Inline edit"}</Badge>}
                </div>
                <EditableText
                  value={visibleBio}
                  draftValue={isPt ? stringValue(draft.bioPt) : stringValue(draft.bio)}
                  isEditing={isEditing}
                  onChange={(value) => updateLocalizedDraft("bio", value)}
                  placeholder={isPt ? "Conte sua trajetoria, projeto atual e interesses." : "Share your background, current project, and interests."}
                  className="whitespace-pre-line text-sm leading-6 text-muted-foreground"
                  multiline
                />
              </section>
            )}

            {hasResearchAreas && (
              <section className="rounded-lg border border-border bg-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  <h2 className="font-semibold text-foreground">{t("people.researchAreas")}</h2>
                </div>

                {isEditing ? (
                  <ProfileTermPicker
                    kind="research_area"
                    selected={selectedResearchAreas}
                    isPt={isPt}
                    onChange={(areas) => updateDraft("research_areas", areas)}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.research_areas!.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => navigateToPeopleFilter("area", area)}
                        className="inline-flex min-h-8 items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                        title={isPt ? `Ver todos com "${area}"` : `View all with "${area}"`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {hasSkills && (
              <section className="rounded-lg border border-border bg-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase size={18} className="text-primary" />
                  <h2 className="font-semibold text-foreground">{t("people.skills")}</h2>
                </div>
                {isEditing ? (
                  <ProfileTermPicker
                    kind="skill"
                    selected={selectedSkills}
                    isPt={isPt}
                    onChange={(skills) => updateDraft("skills", skills)}
                    emptyText={isPt ? "Nenhuma habilidade selecionada ainda." : "No skills selected yet."}
                    searchPlaceholder={isPt ? "Buscar habilidade existente" : "Search existing skill"}
                    customPlaceholder={isPt ? "Nova habilidade ou tecnologia" : "New skill or technology"}
                    addLabel={isPt ? "Adicionar nova habilidade" : "Add new skill"}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills!.map((skill) => (
                      <span key={skill} className="inline-flex min-h-8 items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}
          </main>

          <aside className="space-y-6">
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 font-semibold text-foreground">{isPt ? "Contato e links" : "Contact & links"}</h2>
              {isEditing ? (
                <div className="space-y-3 text-sm">
                  <div className="flex min-h-10 items-center gap-2 rounded-lg bg-secondary/60 px-3 text-muted-foreground">
                    <Mail size={16} />
                    <span className="min-w-0 truncate">{profile.email}</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      {isPt ? "Relacao com o lab" : "Relationship with the lab"}
                    </label>
                    <select
                      value={stringValue(draft.lab_relationship_type) || "academic_advisor"}
                      onChange={(event) => updateDraft("lab_relationship_type", event.target.value)}
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                    >
                      <option value="academic_advisor">{isPt ? "Orientador acadêmico" : "Academic advisor"}</option>
                      <option value="usp_organization">{isPt ? "Organização da USP (Técnicos, Grupos de Extensão...)" : "USP organization (technicians, extension groups...)"}</option>
                      <option value="external_organization">{isPt ? "Organização externa (Universidade, Empresa)" : "External organization (university, company)"}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      {isPt ? "Nome da afiliacao/organizacao" : "Affiliation or organization name"}
                    </label>
                    <AffiliationInput
                      value={stringValue(draft.affiliation_name)}
                      onChange={(value) => updateDraft("affiliation_name", value)}
                      relationshipType={stringValue(draft.lab_relationship_type) || "academic_advisor"}
                      placeholder={isPt ? "Digite ou selecione uma afiliacao existente" : "Type or select an existing affiliation"}
                    />
                  </div>
                  {SOCIAL_LINKS.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Icon size={16} className="shrink-0 text-muted-foreground" />
                      <Input
                        value={stringValue(draft[key])}
                        onChange={(event) => updateDraft(key, event.target.value)}
                        placeholder={`${label} URL`}
                        type="url"
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
                    <Mail size={16} />
                    <span className="min-w-0 truncate">{profile.email}</span>
                  </a>
                  {SOCIAL_LINKS.map(({ key, label, icon: Icon }) => {
                    const value = profile[key];
                    if (!value) return null;
                    return (
                      <a key={key} href={value} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
                        <Icon size={16} />
                        <span className="min-w-0 truncate">{label}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </section>

            {isOwnProfile && !isEditing && (
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="mb-3 font-semibold text-foreground">{isPt ? "Perfil" : "Profile"}</h2>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${profileCompletion * 25}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isPt ? `${profileCompletion}/4 blocos preenchidos` : `${profileCompletion}/4 blocks filled`}
                </p>
                <Button variant="outline" size="sm" className="mt-4 w-full justify-start" onClick={() => navigate("/settings")}>
                  <Settings size={14} className="mr-2" />
                  {t("menu.settings")}
                </Button>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
