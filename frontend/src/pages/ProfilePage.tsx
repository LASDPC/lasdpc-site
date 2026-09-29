import { useMemo, useRef, useState } from "react";
import type React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDocentes, useStudents, useUser } from "@/hooks/usePeople";
import { peopleService } from "@/services/people";
import type { User } from "@/services/auth";
import { uploadProfilePhoto, uploadProfileBanner } from "@/services/uploads";
import { mediaUrl } from "@/lib/media";
import AffiliationInput from "@/components/profile/AffiliationInput";
import ProfileTermPicker from "@/components/profile/ProfileTermPicker";
import {
  Mail, ExternalLink, GraduationCap, BookOpen, User as UserIcon,
  Linkedin, Github, Twitter, Pencil, Save, XCircle, Plus,
  X, Check, Link2, CalendarDays, Briefcase, Search, Sparkles, Settings,
  ArrowLeft, ArrowUpRight, CircleCheck, CircleAlert, Info, ImagePlus, Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CLASSIC_RESEARCH_AREAS } from "@/lib/researchAreas";

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
  "level", "levelPt", "year_joined", "graduation_year", "exit_date",
  "skills", "research_areas",
  "linkedin", "github", "twitter", "researchgate", "lattes", "orcid", "scholar", "page",
  "lab_relationship_type", "affiliation_name",
] as const;

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

const REQUIRED_LINKS = new Set(["lattes"]);

const REQUIRED_FIELD_LABELS: Record<string, { pt: string; en: string; target: string }> = {
  lattes: { pt: "Lattes", en: "Lattes", target: "profile-links" },
};

const getMissingFields = (values: Record<string, unknown>) =>
  stringValue(values.lattes).trim() ? [] : ["lattes"];

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

const exitYear = (profile: User) => {
  if (profile.exit_date?.match(/^\d{4}/)) return profile.exit_date.slice(0, 4);
  return profile.graduation_year ? String(profile.graduation_year) : "";
};

const formatDate = (value?: string | null, isPt = false) => {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, year, month, day] = match;
  return isPt ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
};

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

const NonCopyableEmail = ({ email }: { email: string }) => (
  <span
    className="min-w-0 select-none truncate text-muted-foreground"
    draggable={false}
    onCopy={(event) => event.preventDefault()}
    onCut={(event) => event.preventDefault()}
    onDragStart={(event) => event.preventDefault()}
    onContextMenu={(event) => event.preventDefault()}
  >
    {email}
  </span>
);

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
  const { user: currentUser, refreshUser } = useAuth();
  const isPt = lang === "pt-BR";
  const { data: profile, isLoading } = useUser(userId || "");
  const { data: docentes = [] } = useDocentes();
  const { data: students = [] } = useStudents();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [showValidation, setShowValidation] = useState(false);

  const globalResearchAreas = useMemo(() => {
    const people = [...docentes, ...students];
    return uniqueSorted([
      ...CLASSIC_RESEARCH_AREAS,
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
  const activeValues = isEditing ? draft : profile as unknown as Record<string, unknown>;
  const missingFields = getMissingFields(activeValues);
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
    setShowValidation(false);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft({});
    setShowValidation(false);
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
      if (payload.exit_date === "") payload.exit_date = null;
      payload.research_areas = uniqueSorted(listValue(payload.research_areas));
      payload.skills = uniqueSorted(listValue(payload.skills));
      if (profile.role !== "docente") {
        const academicLevel = stringValue(isPt ? payload.levelPt : payload.level).trim()
          || stringValue(isPt ? payload.level : payload.levelPt).trim();
        if (academicLevel) {
          payload.level = stringValue(payload.level).trim() || academicLevel;
          payload.levelPt = stringValue(payload.levelPt).trim() || academicLevel;
        }
      }

      const missing = getMissingFields(payload as Record<string, unknown>);
      if (missing.length) {
        setShowValidation(true);
        document.getElementById(REQUIRED_FIELD_LABELS[missing[0]].target)?.scrollIntoView({ behavior: "smooth", block: "center" });
        toast.error(isPt ? `Confira os campos pendentes: ${missing.map((key) => REQUIRED_FIELD_LABELS[key].pt).join(", ")}.` : `Check the missing fields: ${missing.map((key) => REQUIRED_FIELD_LABELS[key].en).join(", ")}.`);
        return;
      }

      const updatedProfile = await peopleService.updateUser(profile.id, payload);
      queryClient.setQueryData(["user", profile.id], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["user", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(isPt ? "Perfil atualizado!" : "Profile updated!");
      setIsEditing(false);
      setDraft({});
      setShowValidation(false);
      if (isOwnProfile) await refreshUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message.startsWith("Missing required profile fields")
        ? (isPt ? "Ainda faltam dados obrigatórios. Confira os campos destacados." : "Required details are still missing. Check the highlighted fields.")
        : (isPt ? "Erro ao salvar perfil. Tente novamente." : "Could not save your profile. Please try again."));
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
      const { key } = await uploadProfilePhoto(file);

      const updatedProfile = await peopleService.updateUser(profile.id, { photo: key });
      queryClient.setQueryData(["user", profile.id], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["user", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      if (isOwnProfile) await refreshUser();
      toast.success(isPt ? "Foto atualizada!" : "Photo updated!");
    } catch {
      toast.error(isPt ? "Erro ao fazer upload" : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error(isPt ? "Use uma imagem JPG, PNG ou WebP de até 2 MB." : "Use a JPG, PNG, or WebP image up to 2 MB.");
      if (bannerInputRef.current) bannerInputRef.current.value = "";
      return;
    }
    setUploadingBanner(true);
    try {
      const { key } = await uploadProfileBanner(file);
      const updatedProfile = await peopleService.updateUser(profile.id, { banner: key });
      queryClient.setQueryData(["user", profile.id], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["user", profile.id] });
      toast.success(isPt ? "Capa atualizada!" : "Cover updated!");
    } catch {
      toast.error(isPt ? "Não foi possível enviar a capa." : "Could not upload the cover.");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleBannerRemove = async () => {
    setUploadingBanner(true);
    try {
      const updatedProfile = await peopleService.updateUser(profile.id, { banner: null });
      queryClient.setQueryData(["user", profile.id], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["user", profile.id] });
      toast.success(isPt ? "Capa removida." : "Cover removed.");
    } catch {
      toast.error(isPt ? "Não foi possível remover a capa." : "Could not remove the cover.");
    } finally {
      setUploadingBanner(false);
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

  const requiredCount = 1;
  const completionCount = requiredCount - missingFields.length;
  const profileAvatar = profile.photo ? (
    <img src={mediaUrl(profile.photo)} alt={isOwnProfile ? "" : profile.name} className="h-28 w-28 rounded-full border-4 border-card object-cover shadow-lg sm:h-32 sm:w-32" />
  ) : (
    <span className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-card bg-primary text-3xl font-bold text-primary-foreground shadow-lg sm:h-32 sm:w-32">{profile.initials}</span>
  );

  return (
    <div className="refreshed-page min-h-screen py-10 md:py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <button type="button" onClick={() => navigate("/people")} className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
              <ArrowLeft size={16} /> {isPt ? "Voltar para pessoas" : "Back to people"}
            </button>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-primary">{isOwnProfile ? (isPt ? "Área pessoal / perfil" : "Personal area / profile") : (isPt ? "Pessoas / perfil" : "People / profile")}</p>
          </div>
          {isOwnProfile && !isEditing && (
            <Button onClick={startEditing} className="rounded-xl px-5">
              <Pencil size={16} className="mr-2" /> {isPt ? "Editar meu perfil" : "Edit my profile"}
            </Button>
          )}
        </div>
        <section className="surface-panel overflow-hidden rounded-3xl">
          <div className="relative h-32 overflow-hidden bg-[radial-gradient(circle_at_18%_22%,hsl(var(--accent)/0.3),transparent_30%),linear-gradient(115deg,hsl(var(--primary)/0.22),hsl(var(--accent)/0.12),hsl(var(--background)))] sm:h-40">
            {profile.banner ? <img src={mediaUrl(profile.banner)} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="tech-grid absolute inset-0 opacity-40" />}
            {isOwnProfile && (
              <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-5 sm:top-5">
                <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBannerUpload} className="hidden" aria-label={isPt ? "Selecionar imagem de capa" : "Select cover image"} />
                <button type="button" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/20 bg-black/65 px-3 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-black/80 disabled:opacity-60">
                  <ImagePlus size={15} /> {uploadingBanner ? (isPt ? "Enviando..." : "Uploading...") : profile.banner ? (isPt ? "Trocar capa" : "Change cover") : (isPt ? "Adicionar capa" : "Add cover")}
                </button>
                {profile.banner && <button type="button" onClick={handleBannerRemove} disabled={uploadingBanner} aria-label={isPt ? "Remover capa" : "Remove cover"} className="inline-grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-black/65 text-white backdrop-blur-md transition-colors hover:bg-black/80 disabled:opacity-60"><Trash2 size={15} /></button>}
              </div>
            )}
          </div>
          <div className="px-4 pb-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div id="profile-photo" className="relative -mt-14 w-fit shrink-0 scroll-mt-28 sm:-mt-16">
                {isOwnProfile ? (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-label={isPt ? "Alterar foto de perfil" : "Change profile photo"} className="group relative block rounded-full transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/35 disabled:opacity-60">
                    {profileAvatar}
                    <span className="pointer-events-none absolute inset-1 flex items-center justify-center rounded-full bg-black/45 px-3 text-center text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{uploading ? (isPt ? "Enviando..." : "Uploading...") : (isPt ? "Trocar foto" : "Change photo")}</span>
                  </button>
                ) : profileAvatar}
                {isOwnProfile && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handlePhotoUpload} className="hidden" aria-label={isPt ? "Selecionar foto de perfil" : "Select profile photo"} />
                    <p className="mt-2 max-w-32 text-center text-[11px] leading-4 text-muted-foreground">{uploading ? (isPt ? "Enviando..." : "Uploading...") : (isPt ? "Clique na foto para trocar" : "Click photo to change")}</p>
                    {isEditing && <p className="mt-0.5 text-center text-[11px] text-muted-foreground">{isPt ? "JPG/PNG até 2 MB" : "JPG/PNG up to 2 MB"}</p>}
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

                    <div id="profile-academic" className="flex scroll-mt-28 flex-wrap gap-2 text-xs text-muted-foreground">
                      {isEditing && profile.role !== "docente" ? (
                        <div className="w-full max-w-60 space-y-1">
                          <label htmlFor="profile-level" className="text-xs font-medium text-foreground">{isPt ? "Categoria acadêmica" : "Academic category"}</label>
                          <Input id="profile-level" value={isPt ? stringValue(draft.levelPt) || stringValue(draft.level) : stringValue(draft.level) || stringValue(draft.levelPt)} onChange={(event) => updateLocalizedDraft("level", event.target.value)} placeholder={levelPlaceholder} className="h-9" />
                        </div>
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
                          {profile.role === "alumni" && (
                            <Input
                              type="date"
                              value={stringValue(draft.exit_date)}
                              onChange={(event) => updateDraft("exit_date", event.target.value)}
                              placeholder={isPt ? "Data de saída" : "Exit date"}
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
                          {profile.exit_date && profile.role === "alumni" && (
                            <button
                              type="button"
                              onClick={() => navigate(`/people?yearMode=exit&year=${encodeURIComponent(exitYear(profile))}`)}
                              className="inline-flex min-h-7 items-center gap-1 rounded-full border border-border px-2.5 py-1 transition-colors hover:text-primary"
                            >
                              <CalendarDays size={13} />
                              {isPt ? `Saiu em ${formatDate(profile.exit_date, true)}` : `Left ${formatDate(profile.exit_date)}`}
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
                          <Button size="sm" onClick={handleSave} disabled={saving || uploading}>
                            <Save size={14} className="mr-2" />
                            {saving ? (isPt ? "Salvando..." : "Saving...") : t("profile.save")}
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelEditing} disabled={saving}>
                            <XCircle size={14} className="mr-2" />
                            {t("profile.cancel")}
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} aria-label={t("menu.settings")}><Settings size={16} /></Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-5 mt-9">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-primary">{isPt ? "Perfil público" : "Public profile"}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">{isPt ? "Trajetória e contato" : "Background & contact"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{isOwnProfile ? (isPt ? "Apresente sua trajetória, interesses e formas de contato para quem visita o laboratório." : "Share your background, interests, and contact details with visitors.") : (isPt ? "Conheça a trajetória, os interesses e as formas de contato desta pessoa." : "Explore this member's background, interests, and contact details.")}</p>
        </div>

        {isOwnProfile && isEditing && (
          <section className="surface-panel mt-6 rounded-2xl p-5 md:p-6" aria-label={isPt ? "Orientações para editar o perfil" : "Profile editing guide"}>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Info size={20} /></div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold text-foreground">{isPt ? "Seu perfil, do seu jeito" : "Make this profile yours"}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{isPt ? "Edite os campos diretamente nesta página. Clique na foto para trocá-la; os demais dados são salvos juntos em Salvar alterações." : "Edit fields directly on this page. Click the photo to change it; save the other details together with Save changes."}</p>
                <p className="mt-2 text-xs text-muted-foreground">{isPt ? "Apenas o Lattes é obrigatório. Foto, categoria acadêmica, outros links e vínculo são opcionais." : "Only Lattes is required. Photo, academic category, other links, and affiliation are optional."}</p>
              </div>
            </div>
            <div className="mt-5 border-t border-border/70 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{isPt ? "Obrigatório para salvar" : "Required to save"}</p>
                <span className="text-xs text-muted-foreground">{isPt ? `${completionCount}/${requiredCount} preenchidos` : `${completionCount}/${requiredCount} complete`}</span>
              </div>
              <div className="mt-3">
                {Object.entries(REQUIRED_FIELD_LABELS).map(([key, item]) => {
                  const isMissing = missingFields.includes(key);
                  return (
                    <button key={key} type="button" onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth", block: "center" })} className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 ${isMissing ? "border-amber-500/30 bg-amber-500/5 text-foreground" : "border-border/70 bg-secondary/35 text-muted-foreground"}`}>
                      {isMissing ? <CircleAlert size={15} className="shrink-0 text-amber-600 dark:text-amber-400" /> : <CircleCheck size={15} className="shrink-0 text-primary" />}
                      {item[isPt ? "pt" : "en"]}
                    </button>
                  );
                })}
              </div>
              {showValidation && missingFields.length > 0 && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{isPt ? "Preencha os itens pendentes acima para salvar." : "Complete the missing items above to save."}</p>}
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="space-y-6">
            {!hasBio && !hasResearchAreas && !hasSkills && !isEditing && (
              <section className="surface-panel rounded-2xl p-6 md:p-8">
                <UserIcon size={22} className="text-primary" />
                <h3 className="mt-4 font-display text-xl font-semibold text-foreground">{isPt ? "Sobre este perfil" : "About this profile"}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{isOwnProfile ? (isPt ? "Conte um pouco sobre sua pesquisa e seus interesses para apresentar melhor seu trabalho." : "Share your research and interests to introduce your work.") : (isPt ? "Este integrante ainda não adicionou uma biografia ou áreas de pesquisa." : "This member has not added a biography or research areas yet.")}</p>
                {isOwnProfile && <Button variant="outline" size="sm" className="mt-5" onClick={startEditing}><Pencil size={14} className="mr-2" />{isPt ? "Adicionar informações" : "Add details"}</Button>}
              </section>
            )}
            {hasBio && (
              <section className="surface-panel rounded-2xl p-5 md:p-7">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold text-foreground">{t("people.bio")}</h2>
                  {isEditing && <Badge variant="outline" className="rounded-full">{isPt ? "Opcional" : "Optional"}</Badge>}
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
              <section className="surface-panel rounded-2xl p-5 md:p-7">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  <h2 className="font-display text-xl font-semibold text-foreground">{t("people.researchAreas")}</h2>
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
              <section className="surface-panel rounded-2xl p-5 md:p-7">
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase size={18} className="text-primary" />
                  <h2 className="font-display text-xl font-semibold text-foreground">{t("people.skills")}</h2>
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
            <section id="profile-links" className="surface-panel scroll-mt-28 rounded-2xl p-5 md:p-6">
              <h2 className="mb-1 font-display text-xl font-semibold text-foreground">{isPt ? "Vínculo e contato" : "Affiliation & contact"}</h2>
              {isEditing && <p className="mb-5 text-xs leading-5 text-muted-foreground">{isPt ? "Só o Lattes é obrigatório; o vínculo e os outros links são opcionais." : "Only Lattes is required; your affiliation and other links are optional."}</p>}
              {isEditing ? (
                <div className="space-y-3 text-sm">
                  <div className="flex min-h-10 items-center gap-2 rounded-lg bg-secondary/60 px-3 text-muted-foreground">
                    <Mail size={16} />
                    <NonCopyableEmail email={profile.email} />
                  </div>
                  <div id="profile-affiliation" className="scroll-mt-28 space-y-2">
                    <label htmlFor="profile-relationship" className="text-xs font-medium text-foreground">
                      {isPt ? "Relação com o laboratório" : "Relationship with the lab"}
                    </label>
                    <select
                      id="profile-relationship"
                      value={stringValue(draft.lab_relationship_type)}
                      onChange={(event) => updateDraft("lab_relationship_type", event.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">{isPt ? "Selecione seu vínculo" : "Select your relationship"}</option>
                      <option value="academic_advisor">{isPt ? "Orientador acadêmico" : "Academic advisor"}</option>
                      <option value="usp_organization">{isPt ? "Organização da USP (Técnicos, Grupos de Extensão...)" : "USP organization (technicians, extension groups...)"}</option>
                      <option value="external_organization">{isPt ? "Organização externa (Universidade, Empresa)" : "External organization (university, company)"}</option>
                    </select>
                  </div>
                  <div className="space-y-2 rounded-lg">
                    <label className="text-xs font-medium text-foreground">
                      {isPt ? "Afiliação ou organização" : "Affiliation or organization"}
                    </label>
                    <AffiliationInput
                      value={stringValue(draft.affiliation_name)}
                      onChange={(value) => updateDraft("affiliation_name", value)}
                      relationshipType={stringValue(draft.lab_relationship_type)}
                      placeholder={isPt ? "Digite ou selecione uma afiliacao existente" : "Type or select an existing affiliation"}
                    />
                  </div>
                  <div className="border-t border-border/70 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{isPt ? "Links acadêmicos e redes" : "Academic links and social profiles"}</p>
                  </div>
                  {SOCIAL_LINKS.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="space-y-1">
                      <label htmlFor={`profile-${key}`} className="flex items-center gap-2 text-xs font-medium text-foreground"><Icon size={14} className="text-primary" />{label}{REQUIRED_LINKS.has(key) ? " *" : ""}</label>
                      <Input
                        id={`profile-${key}`}
                        value={stringValue(draft[key])}
                        onChange={(event) => updateDraft(key, event.target.value)}
                        placeholder={`https://…`}
                        type="url"
                        className={showValidation && missingFields.includes(key) ? "border-destructive" : ""}
                        aria-invalid={showValidation && missingFields.includes(key)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={16} />
                    <NonCopyableEmail email={profile.email} />
                  </div>
                  {SOCIAL_LINKS.map(({ key, label, icon: Icon }) => {
                    const value = profile[key];
                    if (!value) return null;
                    return (
                      <a key={key} href={value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary">
                        <Icon size={16} />
                        <span className="min-w-0 truncate">{label}</span>
                        <ArrowUpRight size={14} className="ml-auto" />
                      </a>
                    );
                  })}
                </div>
              )}
            </section>

            {isOwnProfile && !isEditing && (
              <section className="surface-panel rounded-2xl p-5 md:p-6">
                <h2 className="mb-2 font-display text-lg font-semibold text-foreground">{isPt ? "Seu perfil público" : "Your public profile"}</h2>
                <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  {missingFields.length ? <CircleAlert size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" /> : <CircleCheck size={16} className="mt-0.5 shrink-0 text-primary" />}
                  {missingFields.length ? (isPt ? "Adicione seu Lattes para salvar alterações. Os demais campos são opcionais." : "Add your Lattes link to save changes. All other fields are optional.") : (isPt ? "Lattes cadastrado. Você pode acrescentar mais informações quando quiser." : "Lattes is set. Add more details whenever you like.")}
                </p>
                <Button variant="outline" size="sm" className="mt-4 w-full justify-start" onClick={startEditing}>
                  <Pencil size={14} className="mr-2" />
                  {isPt ? "Completar / editar perfil" : "Complete / edit profile"}
                </Button>
              </section>
            )}
          </aside>
        </div>
        {isOwnProfile && isEditing && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm md:p-5">
            <p className="text-xs text-muted-foreground">{isPt ? "Revise seus dados e salve as alterações." : "Review your details and save your changes."}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={cancelEditing} disabled={saving}>{t("profile.cancel")}</Button>
              <Button onClick={handleSave} disabled={saving || uploading}><Save size={15} className="mr-2" />{saving ? (isPt ? "Salvando..." : "Saving...") : (isPt ? "Salvar alterações" : "Save changes")}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
