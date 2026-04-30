import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/hooks/usePeople";
import { peopleService } from "@/services/people";
import { authService } from "@/services/auth";
import { getToken } from "@/lib/api";
import {
  Mail, ExternalLink, Camera, GraduationCap, BookOpen, User as UserIcon,
  Linkedin, Github, Twitter, Trash2, Shield, Pencil, Save, XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
] as const;

const ProfilePageSkeleton = () => (
  <div className="py-10">
    <div className="container mx-auto px-4 max-w-2xl">
      <div className="flex items-start gap-6">
        <Skeleton className="w-24 h-24 rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  </div>
);

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { lang, t } = useLang();
  const { user: currentUser } = useAuth();
  const isPt = lang === "pt-BR";
  const { data: profile, isLoading } = useUser(userId || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});

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

  // Navigation helpers
  const navigateToPeopleFilter = (key: string, value: string) => {
    navigate(`/people?${key}=${encodeURIComponent(value)}`);
  };

  // Editing helpers
  const startEditing = () => {
    const d: Record<string, unknown> = {};
    for (const key of EDITABLE_FIELDS) {
      d[key] = (profile as Record<string, unknown>)[key] ?? (key === "skills" || key === "research_areas" ? [] : "");
    }
    setDraft(d);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft({});
    setIsEditing(false);
  };

  const updateDraft = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {};
      for (const key of EDITABLE_FIELDS) {
        payload[key] = draft[key] ?? null;
      }
      // Convert empty strings for number fields to null
      if (payload.year_joined === "" || payload.year_joined === 0) payload.year_joined = null;
      if (payload.graduation_year === "" || payload.graduation_year === 0) payload.graduation_year = null;

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      const formData = new FormData();
      formData.append("file", file);
      const token = getToken();
      const res = await fetch("/api/v1/uploads", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();

      await peopleService.updateUser(profile.id, { photo: url });
      queryClient.invalidateQueries({ queryKey: ["user", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
      toast.success(isPt ? "Foto atualizada!" : "Photo updated!");
    } catch {
      toast.error(isPt ? "Erro ao fazer upload" : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRequestDeletion = async () => {
    try {
      await authService.requestLgpdDeletion(deletionReason || undefined);
      toast.success(isPt ? "Solicitacao de exclusao enviada!" : "Deletion request submitted!");
      setShowDeleteDialog(false);
      setDeletionReason("");
    } catch {
      toast.error(isPt ? "Erro ao solicitar exclusao" : "Failed to submit deletion request");
    }
  };

  const bio = isPt ? profile.bioPt : profile.bio;
  const hasBio = bio || (isEditing && isOwnProfile);
  const hasResearchAreas = (profile.research_areas && profile.research_areas.length > 0) || (isEditing && isOwnProfile);
  const hasSkills = (profile.skills && profile.skills.length > 0) || (isEditing && isOwnProfile);

  // Clickable element wrapper
  const ClickableFilter = ({ filterKey, value, children, className = "" }: {
    filterKey: string;
    value: string | undefined;
    children: React.ReactNode;
    className?: string;
  }) => {
    if (!value || isEditing) return <>{children}</>;
    return (
      <span
        onClick={() => navigateToPeopleFilter(filterKey, value)}
        className={`cursor-pointer hover:text-primary transition-colors ${className}`}
        title={isPt ? `Ver todos com "${value}"` : `View all with "${value}"`}
      >
        {children}
      </span>
    );
  };

  return (
    <div className="py-10">
      <div className="container mx-auto px-4 max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start gap-6">
          <div className="relative group shrink-0">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-3xl">
                {profile.initials}
              </div>
            )}
            {isOwnProfile && !isEditing && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera size={20} className="text-white" />
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
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={(draft.name as string) ?? ""}
                  onChange={(e) => updateDraft("name", e.target.value)}
                  placeholder={isPt ? "Nome" : "Name"}
                  className="font-display text-xl font-bold"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={(draft.title as string) ?? ""}
                    onChange={(e) => updateDraft("title", e.target.value)}
                    placeholder="Title (EN)"
                  />
                  <Input
                    value={(draft.titlePt as string) ?? ""}
                    onChange={(e) => updateDraft("titlePt", e.target.value)}
                    placeholder="Titulo (PT)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={(draft.area as string) ?? ""}
                    onChange={(e) => updateDraft("area", e.target.value)}
                    placeholder="Area (EN)"
                  />
                  <Input
                    value={(draft.areaPt as string) ?? ""}
                    onChange={(e) => updateDraft("areaPt", e.target.value)}
                    placeholder="Area (PT)"
                  />
                </div>
                {profile.role !== "docente" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={(draft.level as string) ?? ""}
                      onChange={(e) => updateDraft("level", e.target.value)}
                      placeholder="Level (EN)"
                    />
                    <Input
                      value={(draft.levelPt as string) ?? ""}
                      onChange={(e) => updateDraft("levelPt", e.target.value)}
                      placeholder="Nivel (PT)"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={(draft.year_joined as number) ?? ""}
                    onChange={(e) => updateDraft("year_joined", e.target.value ? Number(e.target.value) : "")}
                    placeholder={isPt ? "Ano de ingresso" : "Year joined"}
                  />
                  {profile.role === "alumni" && (
                    <Input
                      type="number"
                      value={(draft.graduation_year as number) ?? ""}
                      onChange={(e) => updateDraft("graduation_year", e.target.value ? Number(e.target.value) : "")}
                      placeholder={isPt ? "Ano de formatura" : "Graduation year"}
                    />
                  )}
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold text-foreground">{profile.name}</h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  {roleIcon}
                  <span>{roleLabel}</span>
                  {profile.is_admin && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">Admin</span>
                  )}
                </div>
                {(profile.title || profile.titlePt) && (
                  <p className="text-sm text-foreground mt-2">{isPt ? profile.titlePt : profile.title}</p>
                )}
                {(profile.area || profile.areaPt) && (
                  <ClickableFilter filterKey="area" value={isPt ? profile.areaPt : profile.area}>
                    <p className="text-sm text-accent mt-1">{isPt ? profile.areaPt : profile.area}</p>
                  </ClickableFilter>
                )}
                {(profile.level || profile.levelPt) && (
                  <ClickableFilter filterKey="level" value={isPt ? profile.levelPt : profile.level}>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isPt ? profile.levelPt : profile.level}
                    </p>
                  </ClickableFilter>
                )}
                {profile.year_joined && (
                  <ClickableFilter filterKey="year" value={String(profile.year_joined)}>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isPt ? `Desde ${profile.year_joined}` : `Since ${profile.year_joined}`}
                    </p>
                  </ClickableFilter>
                )}
                {profile.graduation_year && profile.role === "alumni" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isPt ? `Formado em ${profile.graduation_year}` : `Graduated ${profile.graduation_year}`}
                  </p>
                )}
              </>
            )}

            {/* Edit / Save / Cancel buttons */}
            {isOwnProfile && (
              <div className="mt-3 flex gap-2">
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
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    <Pencil size={14} className="mr-2" />
                    {t("profile.edit")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {hasBio && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display font-semibold text-foreground mb-2">{t("people.bio")}</h2>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">English</label>
                  <textarea
                    value={(draft.bio as string) ?? ""}
                    onChange={(e) => updateDraft("bio", e.target.value)}
                    className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                    placeholder="Bio (English)"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Portugues</label>
                  <textarea
                    value={(draft.bioPt as string) ?? ""}
                    onChange={(e) => updateDraft("bioPt", e.target.value)}
                    className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                    placeholder="Bio (Portugues)"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-line">{bio}</p>
            )}
          </div>
        )}

        {/* Research Areas */}
        {hasResearchAreas && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display font-semibold text-foreground mb-3">{t("people.researchAreas")}</h2>
            {isEditing ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isPt ? "Uma por linha" : "One per line"}
                </label>
                <textarea
                  value={((draft.research_areas as string[]) ?? []).join("\n")}
                  onChange={(e) => updateDraft("research_areas", e.target.value.split("\n").filter(Boolean))}
                  className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                  placeholder={isPt ? "Ex: HPC\nInteligencia Artificial" : "E.g.: HPC\nArtificial Intelligence"}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.research_areas!.map((area) => (
                  <span
                    key={area}
                    onClick={() => navigateToPeopleFilter("area", area)}
                    className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
                    title={isPt ? `Ver todos com "${area}"` : `View all with "${area}"`}
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skills */}
        {hasSkills && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display font-semibold text-foreground mb-3">{t("people.skills")}</h2>
            {isEditing ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isPt ? "Uma por linha" : "One per line"}
                </label>
                <textarea
                  value={((draft.skills as string[]) ?? []).join("\n")}
                  onChange={(e) => updateDraft("skills", e.target.value.split("\n").filter(Boolean))}
                  className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                  placeholder={isPt ? "Ex: Python\nDocker\nKubernetes" : "E.g.: Python\nDocker\nKubernetes"}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills!.map((skill) => (
                  <span key={skill} className="px-3 py-1 text-xs font-medium bg-accent/10 text-accent-foreground rounded-full border border-border">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contact & Links */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-foreground">
            {isPt ? "Contato e Links" : "Contact & Links"}
          </h2>
          {isEditing ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail size={16} />
                <span>{profile.email}</span>
                <span className="text-xs text-muted-foreground/60">{isPt ? "(nao editavel)" : "(read-only)"}</span>
              </div>
              {([
                { key: "lattes", label: "Lattes", icon: <ExternalLink size={16} /> },
                { key: "orcid", label: "ORCID", icon: <ExternalLink size={16} /> },
                { key: "scholar", label: "Google Scholar", icon: <ExternalLink size={16} /> },
                { key: "linkedin", label: "LinkedIn", icon: <Linkedin size={16} /> },
                { key: "github", label: "GitHub", icon: <Github size={16} /> },
                { key: "twitter", label: "Twitter / X", icon: <Twitter size={16} /> },
                { key: "researchgate", label: "ResearchGate", icon: <ExternalLink size={16} /> },
                { key: "page", label: isPt ? "Pagina pessoal" : "Personal page", icon: <ExternalLink size={16} /> },
              ] as const).map(({ key, label, icon }) => (
                <div key={key} className="flex items-center gap-2">
                  {icon}
                  <Input
                    value={(draft[key] as string) ?? ""}
                    onChange={(e) => updateDraft(key, e.target.value)}
                    placeholder={`${label} URL`}
                    type="url"
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail size={16} />
                {profile.email}
              </a>
              {profile.lattes && (
                <a href={profile.lattes} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink size={16} />
                  Lattes
                </a>
              )}
              {profile.orcid && (
                <a href={profile.orcid} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink size={16} />
                  ORCID
                </a>
              )}
              {profile.scholar && (
                <a href={profile.scholar} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink size={16} />
                  Google Scholar
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin size={16} />
                  LinkedIn
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Github size={16} />
                  GitHub
                </a>
              )}
              {profile.twitter && (
                <a href={profile.twitter} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Twitter size={16} />
                  Twitter / X
                </a>
              )}
              {profile.researchgate && (
                <a href={profile.researchgate} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink size={16} />
                  ResearchGate
                </a>
              )}
              {profile.page && (
                <a href={profile.page} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink size={16} />
                  {isPt ? "Pagina pessoal" : "Personal page"}
                </a>
              )}
            </div>
          )}
        </div>

        {/* LGPD Section - own profile only */}
        {isOwnProfile && !isEditing && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-primary" />
              <h2 className="font-display font-semibold text-foreground">{t("profile.lgpd")}</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 size={14} className="mr-2" />
                {t("profile.requestDeletion")}
              </Button>
            </div>
            {showDeleteDialog && (
              <div className="border border-destructive/20 rounded-lg p-4 space-y-3 bg-destructive/5">
                <p className="text-sm text-foreground font-medium">
                  {isPt
                    ? "Tem certeza? Sua conta sera anonimizada apos aprovacao do administrador."
                    : "Are you sure? Your account will be anonymized after admin approval."}
                </p>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder={isPt ? "Motivo (opcional)" : "Reason (optional)"}
                  className="w-full min-h-[60px] bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={handleRequestDeletion}>
                    {isPt ? "Confirmar" : "Confirm"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)}>
                    {isPt ? "Cancelar" : "Cancel"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
