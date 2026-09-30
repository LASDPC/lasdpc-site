import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import AffiliationInput from "@/components/profile/AffiliationInput";
import ProfileTermPicker from "@/components/profile/ProfileTermPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Camera, Fingerprint, GraduationCap, Link2, Save, Sparkles, UserRound } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useDocentes } from "@/hooks/usePeople";
import type { User } from "@/services/auth";
import { uploadProfilePhoto } from "@/services/uploads";
import { mediaUrl } from "@/lib/media";

const LAB_RELATIONSHIP_OPTIONS = [
  { value: "academic_advisor", pt: "Orientador acadêmico", en: "Academic advisor" },
  { value: "usp_organization", pt: "Organização da USP (Técnicos, Grupos de Extensão...)", en: "USP organization (technicians, extension groups...)" },
  { value: "external_organization", pt: "Organização externa (Universidade, Empresa)", en: "External organization (university, company)" },
] as const;

const requiredText = z.string().trim().min(1);

const requireCreationFields = (values: {
  password?: string;
  orcid?: string;
  scholar?: string;
  github?: string;
  affiliation_name?: string;
}, ctx: z.RefinementCtx) => {
  if (!values.password || values.password.length < 12 || new TextEncoder().encode(values.password).length > 72) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "12–72 bytes" });
  }
  for (const field of ["orcid", "scholar", "github", "affiliation_name"] as const) {
    if (!values[field]?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: "Required" });
  }
};

const docenteSchema = z.object({
  name: requiredText,
  email: z.string().email(),
  title: z.string().optional(),
  titlePt: z.string().optional(),
  area: z.string().optional(),
  areaPt: z.string().optional(),
  lattes: requiredText,
  orcid: z.string().optional(),
  scholar: z.string().optional(),
  page: z.string().optional(),
  password: z.string().optional(),
  bio: z.string().optional(),
  bioPt: z.string().optional(),
  year_joined: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  exit_date: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  twitter: z.string().optional(),
  researchgate: z.string().optional(),
  usp_number: z.string().optional(),
  lab_relationship_type: z.enum(["academic_advisor", "usp_organization", "external_organization"]),
  affiliation_name: z.string().optional(),
});
const docenteCreateSchema = docenteSchema.superRefine(requireCreationFields);

const studentSchema = z.object({
  name: requiredText,
  email: z.string().email(),
  role: z.enum(["aluno_ativo", "alumni"]),
  level: requiredText,
  levelPt: requiredText,
  advisor_id: requiredText,
  area: z.string().optional(),
  areaPt: z.string().optional(),
  password: z.string().optional(),
  bio: z.string().optional(),
  bioPt: z.string().optional(),
  year_joined: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  graduation_year: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  exit_date: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  twitter: z.string().optional(),
  researchgate: z.string().optional(),
  usp_number: z.string().optional(),
  lattes: requiredText,
  orcid: z.string().optional(),
  scholar: z.string().optional(),
  lab_relationship_type: z.enum(["academic_advisor", "usp_organization", "external_organization"]),
  affiliation_name: z.string().optional(),
});
const studentCreateSchema = studentSchema.superRefine(requireCreationFields);

interface DocenteFormProps {
  type: "docente";
  initial?: Partial<User>;
  onSubmit: (data: Record<string, unknown>) => void;
  loading?: boolean;
  lang?: "en" | "pt";
}

interface StudentFormProps {
  type: "student";
  initial?: Partial<User>;
  onSubmit: (data: Record<string, unknown>) => void;
  loading?: boolean;
  lang?: "en" | "pt";
}

type PersonFormProps = DocenteFormProps | StudentFormProps;

const requiredMessage = (pt: boolean) => (pt ? "Obrigatorio" : "Required");

const initialsFor = (name: string) => {
  const names = name.trim().split(/\s+/);
  return names.length >= 2 ? (names[0][0] + names[names.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
};

const numberOrNull = (value: unknown) => value || null;

function FormSection({
  id, number, icon: Icon, title, description, children,
}: {
  id: string;
  number: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="surface-panel scroll-mt-28 rounded-2xl p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-3 border-b border-border/70 pb-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={19} /></span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{number}</p>
          <h2 className="mt-0.5 font-display text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function PersonFormShell({
  name, email, photo, pt, isEdit, type, loading, children,
}: {
  name: string;
  email: string;
  photo: string;
  pt: boolean;
  isEdit: boolean;
  type: "docente" | "student";
  loading?: boolean;
  children: ReactNode;
}) {
  const links = [
    { id: "identity", label: pt ? "Identificação" : "Identity", icon: UserRound },
    { id: "academic", label: pt ? "Vínculo acadêmico" : "Academic details", icon: GraduationCap },
    { id: "sources", label: pt ? "Fontes e afiliação" : "Sources & affiliation", icon: BookOpen },
    { id: "public-profile", label: pt ? "Perfil público" : "Public profile", icon: Sparkles },
    { id: "social-links", label: pt ? "Outros links" : "Other links", icon: Link2 },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
      <aside className="surface-panel rounded-2xl p-4 lg:sticky lg:top-28">
        <div className="flex items-center gap-3 border-b border-border/70 px-1 pb-4">
          {photo ? <img src={mediaUrl(photo)} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound size={23} /></span>}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{name || (pt ? "Novo perfil" : "New profile")}</p>
            <p className="truncate text-xs text-muted-foreground">{email || (pt ? "Sem e-mail" : "No email yet")}</p>
          </div>
        </div>
        <div className="px-1 pt-3 lg:pt-4">
          <Badge variant="outline" className="rounded-full lg:mb-4">{type === "docente" ? (pt ? "Docente" : "Faculty") : (pt ? "Aluno" : "Student")}</Badge>
          <nav aria-label={pt ? "Seções do perfil" : "Profile sections"} className="hidden space-y-1 lg:block">
            {links.map(({ id, label, icon: Icon }) => (
              <a key={id} href={`#${id}`} className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Icon size={16} />{label}
              </a>
            ))}
            {isEdit && <a href="#account-access" className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><Fingerprint size={16} />{pt ? "Acesso à conta" : "Account access"}</a>}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 space-y-6">
        {children}
        <div className="surface-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/15 px-5 py-4">
          <p className="text-sm text-muted-foreground">{pt ? "Revise as informações antes de salvar." : "Review the details before saving."}</p>
          <Button type="submit" disabled={loading || (!isEdit && !photo)}>
            <Save size={16} />{loading ? (pt ? "Salvando..." : "Saving...") : isEdit ? (pt ? "Salvar perfil" : "Save profile") : (pt ? "Criar perfil" : "Create profile")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProfilePhotoField({
  photo,
  setPhoto,
  pt,
  required,
}: {
  photo: string;
  setPhoto: (value: string) => void;
  pt: boolean;
  required: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { key } = await uploadProfilePhoto(file);
      setPhoto(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-secondary/35 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {photo ? (
          <img src={mediaUrl(photo)} alt="" className="h-20 w-20 rounded-2xl border border-border object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
            <Camera size={25} />
          </div>
        )}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{pt ? "Foto do perfil" : "Profile photo"}</p>
          <p className="text-xs text-muted-foreground">{required ? (pt ? "Obrigatória para criar a conta." : "Required to create the account.") : (pt ? "Opcional ao editar o perfil." : "Optional when editing the profile.")}</p>
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Camera size={15} />{uploading ? "..." : photo ? (pt ? "Trocar foto" : "Change photo") : pt ? "Enviar foto" : "Upload photo"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </div>
      </div>
      {required && !photo && <p className="mt-3 text-xs text-destructive">{requiredMessage(pt)}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function RequiredProfileSection({
  pt,
  isEdit,
  register,
  errors,
  relationshipType,
  affiliationName,
  onAffiliationChange,
}: {
  pt: boolean;
  isEdit: boolean;
  register: ReturnType<typeof useForm>["register"];
  errors: Record<string, { message?: string }>;
  relationshipType?: string;
  affiliationName: string;
  onAffiliationChange: (value: string) => void;
}) {
  return (
    <FormSection id="sources" number="03" icon={BookOpen} title={pt ? "Fontes e afiliação" : "Sources & affiliation"} description={isEdit ? (pt ? "Lattes é necessário para salvar; os demais links podem ser preenchidos depois." : "Lattes is needed to save; other links can be added later.") : (pt ? "Informe as fontes acadêmicas e o vínculo da nova conta." : "Add academic sources and the new account's affiliation.")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Lattes URL *</Label>
          <Input {...register("lattes")} />
          {errors.lattes && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
        </div>
        <div>
          <Label>ORCID URL{!isEdit && " *"}</Label>
          <Input {...register("orcid")} />
          {errors.orcid && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Google Scholar URL{!isEdit && " *"}</Label>
          <Input {...register("scholar")} />
          {errors.scholar && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
        </div>
        <div>
          <Label>GitHub{!isEdit && " *"}</Label>
          <Input {...register("github")} placeholder="https://github.com/..." />
          {errors.github && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
        </div>
      </div>
      <div>
        <Label>{pt ? "Relação com o laboratório" : "Relationship with the lab"}</Label>
        <select {...register("lab_relationship_type")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {LAB_RELATIONSHIP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{pt ? option.pt : option.en}</option>
          ))}
        </select>
        {errors.lab_relationship_type && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
      </div>
      <div>
        <Label>{pt ? "Afiliação ou organização" : "Affiliation or organization"}{!isEdit && " *"}</Label>
        <AffiliationInput
          value={affiliationName}
          onChange={onAffiliationChange}
          relationshipType={relationshipType}
          placeholder={pt ? "Digite ou selecione uma afiliacao existente" : "Type or select an existing affiliation"}
        />
        {errors.affiliation_name && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
      </div>
    </FormSection>
  );
}

const PersonForm = (props: PersonFormProps) => {
  if (props.type === "student") {
    return <StudentFormInner {...props} />;
  }
  return <DocenteFormInner {...props} />;
};

const DocenteFormInner = ({ initial, onSubmit, loading, lang }: Omit<DocenteFormProps, "type">) => {
  const isEdit = !!initial;
  const pt = lang === "pt";
  const [photo, setPhoto] = useState(initial?.photo ?? "");
  const [researchAreas, setResearchAreas] = useState<string[]>(initial?.research_areas ?? []);
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<z.infer<typeof docenteSchema>>({
    resolver: zodResolver(isEdit ? docenteSchema : docenteCreateSchema),
    defaultValues: {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      title: initial?.title ?? "",
      titlePt: initial?.titlePt ?? "",
      area: initial?.area ?? "",
      areaPt: initial?.areaPt ?? "",
      lattes: initial?.lattes ?? "",
      orcid: initial?.orcid ?? "",
      scholar: initial?.scholar ?? "",
      page: initial?.page ?? "",
      bio: initial?.bio ?? "",
      bioPt: initial?.bioPt ?? "",
      year_joined: initial?.year_joined ?? ("" as unknown as undefined),
      exit_date: initial?.exit_date ?? "",
      linkedin: initial?.linkedin ?? "",
      github: initial?.github ?? "",
      twitter: initial?.twitter ?? "",
      researchgate: initial?.researchgate ?? "",
      usp_number: initial?.usp_number ?? "",
      lab_relationship_type: (initial?.lab_relationship_type as never) ?? "academic_advisor",
      affiliation_name: initial?.affiliation_name ?? "",
    },
  });

  useEffect(() => setPhoto(initial?.photo ?? ""), [initial?.photo]);

  return (
    <form onSubmit={handleSubmit((v) => {
      if (!photo && !isEdit) return;
      const data: Record<string, unknown> = {
        ...v,
        role: "docente",
        photo,
        page: v.page || null,
        title: v.title || null,
        titlePt: v.titlePt || null,
        area: v.area || null,
        areaPt: v.areaPt || null,
        bio: v.bio || null,
        bioPt: v.bioPt || null,
        research_areas: researchAreas,
        year_joined: numberOrNull(v.year_joined),
        exit_date: v.exit_date || null,
        skills,
        linkedin: v.linkedin || null,
        twitter: v.twitter || null,
        researchgate: v.researchgate || null,
        usp_number: v.usp_number || null,
      };
      if (!isEdit) {
        data.initials = initialsFor(v.name);
        data.password = v.password;
      }
      onSubmit(data);
    })}>
      <PersonFormShell name={watch("name")} email={watch("email")} photo={photo} pt={pt} isEdit={isEdit} type="docente" loading={loading}>
        <FormSection id="identity" number="01" icon={UserRound} title={pt ? "Identificação" : "Identity"} description={pt ? "Dados básicos da conta e imagem exibida no site." : "Basic account details and the image shown on the site."}>
          <ProfilePhotoField photo={photo} setPhoto={setPhoto} pt={pt} required={!isEdit} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="docente-name">{pt ? "Nome" : "Name"} *</Label><Input id="docente-name" {...register("name")} />{errors.name && <p className="mt-1 text-xs text-destructive">{requiredMessage(pt)}</p>}</div>
            <div><Label htmlFor="docente-email">E-mail *</Label><Input id="docente-email" type="email" readOnly={isEdit} className={isEdit ? "bg-secondary/60 text-muted-foreground" : ""} {...register("email")} />{errors.email && <p className="mt-1 text-xs text-destructive">{pt ? "E-mail válido obrigatório" : "Valid email required"}</p>}</div>
          </div>
          {isEdit ? <p className="text-xs text-muted-foreground">{pt ? "O e-mail de login não pode ser alterado nesta tela." : "The login email cannot be changed here."}</p> : <div><Label htmlFor="docente-password">{pt ? "Senha inicial" : "Initial password"} *</Label><Input id="docente-password" type="password" autoComplete="new-password" {...register("password")} /><p className="mt-1 text-xs text-muted-foreground">{pt ? "Use entre 12 e 72 bytes. A senha poderá ser alterada depois." : "Use 12 to 72 bytes. The password can be changed later."}</p>{errors.password && <p className="mt-1 text-xs text-destructive">{pt ? "Informe uma senha de 12 a 72 bytes." : "Enter a password of 12 to 72 bytes."}</p>}</div>}
        </FormSection>

        <FormSection id="academic" number="02" icon={GraduationCap} title={pt ? "Vínculo acadêmico" : "Academic details"} description={pt ? "Título e área de atuação em português e inglês." : "Title and research area in Portuguese and English."}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>{pt ? "Título (EN)" : "Title (EN)"}</Label><Input {...register("title")} placeholder="Full Professor" /></div>
            <div><Label>{pt ? "Título (PT)" : "Title (PT)"}</Label><Input {...register("titlePt")} placeholder="Professor Titular" /></div>
            <div><Label>{pt ? "Área (EN)" : "Area (EN)"}</Label><Input {...register("area")} /></div>
            <div><Label>{pt ? "Área (PT)" : "Area (PT)"}</Label><Input {...register("areaPt")} /></div>
          </div>
        </FormSection>

      <RequiredProfileSection
        pt={pt}
        isEdit={isEdit}
        register={register as never}
        errors={errors as never}
        relationshipType={watch("lab_relationship_type")}
        affiliationName={watch("affiliation_name")}
        onAffiliationChange={(value) => setValue("affiliation_name", value, { shouldValidate: true })}
      />

      <FormSection id="public-profile" number="04" icon={Sparkles} title={pt ? "Perfil público" : "Public profile"} description={pt ? "Apresente a trajetória, temas de pesquisa e habilidades deste docente." : "Describe this faculty member's background, research topics, and skills."}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>{pt ? "Biografia (EN)" : "Biography (EN)"}</Label><Textarea {...register("bio")} className="min-h-28" /></div>
          <div><Label>{pt ? "Biografia (PT)" : "Biography (PT)"}</Label><Textarea {...register("bioPt")} className="min-h-28" /></div>
        </div>
        <div>
          <Label>{pt ? "Areas de pesquisa" : "Research areas"}</Label>
          <ProfileTermPicker kind="research_area" selected={researchAreas} onChange={setResearchAreas} isPt={pt} />
        </div>
        <div>
          <Label>{pt ? "Habilidades e tecnologias" : "Skills and technologies"}</Label>
          <ProfileTermPicker kind="skill" selected={skills} onChange={setSkills} isPt={pt} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>{pt ? "Ano de ingresso" : "Year joined"}</Label><Input type="number" {...register("year_joined")} placeholder="2020" /></div>
          <div><Label>{pt ? "Data de saída" : "Exit date"}</Label><Input type="date" {...register("exit_date")} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>{pt ? "Numero USP" : "USP Number"}</Label><Input {...register("usp_number")} /></div>
        </div>
      </FormSection>

      <FormSection id="social-links" number="05" icon={Link2} title={pt ? "Outros links" : "Other links"} description={pt ? "Canais opcionais exibidos no perfil público." : "Optional channels shown on the public profile."}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>LinkedIn</Label><Input {...register("linkedin")} placeholder="https://linkedin.com/in/..." /></div>
          <div><Label>{pt ? "Pagina pessoal" : "Personal page"}</Label><Input {...register("page")} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Twitter / X</Label><Input {...register("twitter")} placeholder="https://twitter.com/..." /></div>
          <div><Label>ResearchGate</Label><Input {...register("researchgate")} placeholder="https://researchgate.net/..." /></div>
        </div>
      </FormSection>
      </PersonFormShell>
    </form>
  );
};

const StudentFormInner = ({ initial, onSubmit, loading, lang }: Omit<StudentFormProps, "type">) => {
  const isEdit = !!initial;
  const pt = lang === "pt";
  const { data: docentes = [] } = useDocentes();
  const [photo, setPhoto] = useState(initial?.photo ?? "");
  const [researchAreas, setResearchAreas] = useState<string[]>(initial?.research_areas ?? []);
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(isEdit ? studentSchema : studentCreateSchema),
    defaultValues: {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      role: (initial?.role as "aluno_ativo" | "alumni") ?? "aluno_ativo",
      level: initial?.level ?? "",
      levelPt: initial?.levelPt ?? "",
      advisor_id: initial?.advisor_id ?? "",
      area: initial?.area ?? "",
      areaPt: initial?.areaPt ?? "",
      bio: initial?.bio ?? "",
      bioPt: initial?.bioPt ?? "",
      year_joined: initial?.year_joined ?? ("" as unknown as undefined),
      graduation_year: initial?.graduation_year ?? ("" as unknown as undefined),
      exit_date: initial?.exit_date ?? "",
      linkedin: initial?.linkedin ?? "",
      github: initial?.github ?? "",
      twitter: initial?.twitter ?? "",
      researchgate: initial?.researchgate ?? "",
      usp_number: initial?.usp_number ?? "",
      lattes: initial?.lattes ?? "",
      orcid: initial?.orcid ?? "",
      scholar: initial?.scholar ?? "",
      lab_relationship_type: (initial?.lab_relationship_type as never) ?? "academic_advisor",
      affiliation_name: initial?.affiliation_name ?? "",
    },
  });

  useEffect(() => setPhoto(initial?.photo ?? ""), [initial?.photo]);
  const selectedRole = watch("role");

  return (
    <form onSubmit={handleSubmit((v) => {
      if (!photo && !isEdit) return;
      const advisor = docentes.find((docente) => docente.id === v.advisor_id);
      const data: Record<string, unknown> = {
        ...v,
        role: v.role,
        photo,
        advisor_id: v.advisor_id,
        advisor_name: advisor?.name ?? initial?.advisor_name ?? null,
        area: v.area || null,
        areaPt: v.areaPt || null,
        bio: v.bio || null,
        bioPt: v.bioPt || null,
        research_areas: researchAreas,
        year_joined: numberOrNull(v.year_joined),
        skills,
        graduation_year: v.role === "alumni" ? numberOrNull(v.graduation_year) : null,
        exit_date: v.role === "alumni" ? v.exit_date || null : null,
        linkedin: v.linkedin || null,
        twitter: v.twitter || null,
        researchgate: v.researchgate || null,
        usp_number: v.usp_number || null,
      };
      if (!isEdit) {
        data.initials = initialsFor(v.name);
        data.password = v.password;
      }
      onSubmit(data);
    })}>
      <PersonFormShell name={watch("name")} email={watch("email")} photo={photo} pt={pt} isEdit={isEdit} type="student" loading={loading}>
        <FormSection id="identity" number="01" icon={UserRound} title={pt ? "Identificação" : "Identity"} description={pt ? "Dados básicos da conta e imagem exibida no site." : "Basic account details and the image shown on the site."}>
          <ProfilePhotoField photo={photo} setPhoto={setPhoto} pt={pt} required={!isEdit} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="student-name">{pt ? "Nome" : "Name"} *</Label><Input id="student-name" {...register("name")} />{errors.name && <p className="mt-1 text-xs text-destructive">{requiredMessage(pt)}</p>}</div>
            <div><Label htmlFor="student-email">E-mail *</Label><Input id="student-email" type="email" readOnly={isEdit} className={isEdit ? "bg-secondary/60 text-muted-foreground" : ""} {...register("email")} />{errors.email && <p className="mt-1 text-xs text-destructive">{pt ? "E-mail válido obrigatório" : "Valid email required"}</p>}</div>
          </div>
          {isEdit ? <p className="text-xs text-muted-foreground">{pt ? "O e-mail de login não pode ser alterado nesta tela." : "The login email cannot be changed here."}</p> : <div><Label htmlFor="student-password">{pt ? "Senha inicial" : "Initial password"} *</Label><Input id="student-password" type="password" autoComplete="new-password" {...register("password")} /><p className="mt-1 text-xs text-muted-foreground">{pt ? "Use entre 12 e 72 bytes. A senha poderá ser alterada depois." : "Use 12 to 72 bytes. The password can be changed later."}</p>{errors.password && <p className="mt-1 text-xs text-destructive">{pt ? "Informe uma senha de 12 a 72 bytes." : "Enter a password of 12 to 72 bytes."}</p>}</div>}
        </FormSection>

        <FormSection id="academic" number="02" icon={GraduationCap} title={pt ? "Vínculo acadêmico" : "Academic details"} description={pt ? "Situação no laboratório, nível e orientação." : "Lab status, academic level, and advisor."}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>{pt ? "Situação no lab" : "Lab status"}</Label><select {...register("role")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="aluno_ativo">{pt ? "Aluno ativo" : "Active student"}</option><option value="alumni">{pt ? "Egresso" : "Alumni"}</option></select></div>
            <div><Label>{pt ? "Orientador" : "Advisor"} *</Label><select {...register("advisor_id")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">{pt ? "Selecione um orientador" : "Select an advisor"}</option>{docentes.map((docente) => <option key={docente.id} value={docente.id}>{docente.name}</option>)}</select>{errors.advisor_id && <p className="mt-1 text-xs text-destructive">{requiredMessage(pt)}</p>}</div>
            <div><Label>{pt ? "Nível (EN)" : "Level (EN)"} *</Label><Input {...register("level")} placeholder="PhD, MSc, Undergrad" />{errors.level && <p className="mt-1 text-xs text-destructive">{requiredMessage(pt)}</p>}</div>
            <div><Label>{pt ? "Nível (PT)" : "Level (PT)"} *</Label><Input {...register("levelPt")} placeholder="Doutorado, Mestrado" />{errors.levelPt && <p className="mt-1 text-xs text-destructive">{requiredMessage(pt)}</p>}</div>
            <div><Label>{pt ? "Área (EN)" : "Area (EN)"}</Label><Input {...register("area")} /></div>
            <div><Label>{pt ? "Área (PT)" : "Area (PT)"}</Label><Input {...register("areaPt")} /></div>
          </div>
        </FormSection>

      <RequiredProfileSection
        pt={pt}
        isEdit={isEdit}
        register={register as never}
        errors={errors as never}
        relationshipType={watch("lab_relationship_type")}
        affiliationName={watch("affiliation_name")}
        onAffiliationChange={(value) => setValue("affiliation_name", value, { shouldValidate: true })}
      />

      <FormSection id="public-profile" number="04" icon={Sparkles} title={pt ? "Perfil público" : "Public profile"} description={pt ? "Apresente a trajetória, temas de pesquisa e habilidades deste aluno." : "Describe this student's background, research topics, and skills."}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>{pt ? "Biografia (EN)" : "Biography (EN)"}</Label><Textarea {...register("bio")} className="min-h-28" /></div>
          <div><Label>{pt ? "Biografia (PT)" : "Biography (PT)"}</Label><Textarea {...register("bioPt")} className="min-h-28" /></div>
        </div>
        <div>
          <Label>{pt ? "Areas de pesquisa" : "Research areas"}</Label>
          <ProfileTermPicker kind="research_area" selected={researchAreas} onChange={setResearchAreas} isPt={pt} />
        </div>
        <div>
          <Label>{pt ? "Habilidades e tecnologias" : "Skills and technologies"}</Label>
          <ProfileTermPicker kind="skill" selected={skills} onChange={setSkills} isPt={pt} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>{pt ? "Ano de ingresso" : "Year joined"}</Label><Input type="number" {...register("year_joined")} placeholder="2020" /></div>
          <div><Label>{pt ? "Numero USP" : "USP Number"}</Label><Input {...register("usp_number")} /></div>
        </div>
        {selectedRole === "alumni" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>{pt ? "Ano de formatura" : "Graduation year"}</Label><Input type="number" {...register("graduation_year")} placeholder="2024" /></div>
            <div><Label>{pt ? "Data de saída" : "Exit date"}</Label><Input type="date" {...register("exit_date")} /></div>
          </div>
        )}
      </FormSection>

      <FormSection id="social-links" number="05" icon={Link2} title={pt ? "Outros links" : "Other links"} description={pt ? "Canais opcionais exibidos no perfil público." : "Optional channels shown on the public profile."}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>LinkedIn</Label><Input {...register("linkedin")} placeholder="https://linkedin.com/in/..." /></div>
          <div><Label>Twitter / X</Label><Input {...register("twitter")} placeholder="https://twitter.com/..." /></div>
        </div>
        <div><Label>ResearchGate</Label><Input {...register("researchgate")} placeholder="https://researchgate.net/..." /></div>
      </FormSection>
      </PersonFormShell>
    </form>
  );
};

export default PersonForm;
