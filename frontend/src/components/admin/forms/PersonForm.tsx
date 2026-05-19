import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import AffiliationInput from "@/components/profile/AffiliationInput";
import ProfileTermPicker from "@/components/profile/ProfileTermPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const docenteSchema = z.object({
  name: requiredText,
  email: z.string().email(),
  title: z.string().optional(),
  titlePt: z.string().optional(),
  area: z.string().optional(),
  areaPt: z.string().optional(),
  lattes: requiredText,
  orcid: requiredText,
  scholar: requiredText,
  page: z.string().optional(),
  password: z.string().optional(),
  bio: z.string().optional(),
  bioPt: z.string().optional(),
  year_joined: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  exit_date: z.string().optional(),
  linkedin: z.string().optional(),
  github: requiredText,
  twitter: z.string().optional(),
  researchgate: z.string().optional(),
  usp_number: z.string().optional(),
  lab_relationship_type: z.enum(["academic_advisor", "usp_organization", "external_organization"]),
  affiliation_name: requiredText,
});

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
  github: requiredText,
  twitter: z.string().optional(),
  researchgate: z.string().optional(),
  usp_number: z.string().optional(),
  lattes: requiredText,
  orcid: requiredText,
  scholar: requiredText,
  lab_relationship_type: z.enum(["academic_advisor", "usp_organization", "external_organization"]),
  affiliation_name: requiredText,
});

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

function ProfilePhotoField({
  photo,
  setPhoto,
  pt,
}: {
  photo: string;
  setPhoto: (value: string) => void;
  pt: boolean;
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
    <div className="space-y-2">
      <Label>{pt ? "Foto de perfil" : "Profile photo"}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {photo ? (
          <img src={mediaUrl(photo)} alt="" className="h-16 w-16 rounded-full border border-border object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-secondary text-xs text-muted-foreground">
            {pt ? "Sem foto" : "No photo"}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? "..." : pt ? "Enviar foto" : "Upload photo"}
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
      {!photo && <p className="text-xs text-destructive">{requiredMessage(pt)}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function RequiredProfileSection({
  pt,
  register,
  errors,
  relationshipType,
  affiliationName,
  onAffiliationChange,
}: {
  pt: boolean;
  register: ReturnType<typeof useForm>["register"];
  errors: Record<string, { message?: string }>;
  relationshipType?: string;
  affiliationName: string;
  onAffiliationChange: (value: string) => void;
}) {
  return (
    <div className="border-t border-border pt-4 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {pt ? "Campos obrigatorios do perfil publico" : "Required public profile fields"}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Lattes URL</Label>
          <Input {...register("lattes")} />
          {errors.lattes && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
        </div>
        <div>
          <Label>ORCID URL</Label>
          <Input {...register("orcid")} />
          {errors.orcid && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Google Scholar URL</Label>
          <Input {...register("scholar")} />
          {errors.scholar && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
        </div>
        <div>
          <Label>GitHub</Label>
          <Input {...register("github")} placeholder="https://github.com/..." />
          {errors.github && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
        </div>
      </div>
      <div>
        <Label>{pt ? "Relacao com o lab" : "Relationship with the lab"}</Label>
        <select {...register("lab_relationship_type")} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm">
          {LAB_RELATIONSHIP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{pt ? option.pt : option.en}</option>
          ))}
        </select>
        {errors.lab_relationship_type && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
      </div>
      <div>
        <Label>{pt ? "Nome da afiliacao/organizacao" : "Affiliation or organization name"}</Label>
        <AffiliationInput
          value={affiliationName}
          onChange={onAffiliationChange}
          relationshipType={relationshipType}
          placeholder={pt ? "Digite ou selecione uma afiliacao existente" : "Type or select an existing affiliation"}
        />
        {errors.affiliation_name && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
      </div>
    </div>
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
    resolver: zodResolver(docenteSchema),
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
      if (!photo) return;
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
        if (!v.password) data.password = "changeme123";
      }
      onSubmit(data);
    })} className="space-y-6">
      <div className="space-y-4">
        <ProfilePhotoField photo={photo} setPhoto={setPhoto} pt={pt} />
        <div><Label>{pt ? "Nome" : "Name"}</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}</div>
        <div><Label>E-mail</Label><Input {...register("email")} />{errors.email && <p className="text-xs text-destructive mt-1">{pt ? "E-mail valido obrigatorio" : "Valid email required"}</p>}</div>
        {!isEdit && <div><Label>{pt ? "Senha" : "Password"}</Label><Input type="password" {...register("password")} placeholder={pt ? "Padrao: changeme123" : "Default: changeme123"} /></div>}
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Titulo (EN)" : "Title (EN)"}</Label><Input {...register("title")} placeholder="Full Professor" /></div>
          <div><Label>{pt ? "Titulo (PT)" : "Title (PT)"}</Label><Input {...register("titlePt")} placeholder="Professor Titular" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Area (EN)" : "Area (EN)"}</Label><Input {...register("area")} /></div>
          <div><Label>{pt ? "Area (PT)" : "Area (PT)"}</Label><Input {...register("areaPt")} /></div>
        </div>
      </div>

      <RequiredProfileSection
        pt={pt}
        register={register as never}
        errors={errors as never}
        relationshipType={watch("lab_relationship_type")}
        affiliationName={watch("affiliation_name")}
        onAffiliationChange={(value) => setValue("affiliation_name", value, { shouldValidate: true })}
      />

      <div className="border-t border-border pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{pt ? "Perfil" : "Profile"}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Bio (EN)" : "Bio (EN)"}</Label><textarea {...register("bio")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
          <div><Label>{pt ? "Bio (PT)" : "Bio (PT)"}</Label><textarea {...register("bioPt")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
        </div>
        <div>
          <Label>{pt ? "Areas de pesquisa" : "Research areas"}</Label>
          <ProfileTermPicker kind="research_area" selected={researchAreas} onChange={setResearchAreas} isPt={pt} />
        </div>
        <div>
          <Label>{pt ? "Habilidades e tecnologias" : "Skills and technologies"}</Label>
          <ProfileTermPicker kind="skill" selected={skills} onChange={setSkills} isPt={pt} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Ano de ingresso" : "Year joined"}</Label><Input type="number" {...register("year_joined")} placeholder="2020" /></div>
          <div><Label>{pt ? "Data de saída" : "Exit date"}</Label><Input type="date" {...register("exit_date")} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Numero USP" : "USP Number"}</Label><Input {...register("usp_number")} /></div>
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{pt ? "Redes Sociais" : "Social Links"}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>LinkedIn</Label><Input {...register("linkedin")} placeholder="https://linkedin.com/in/..." /></div>
          <div><Label>{pt ? "Pagina pessoal" : "Personal page"}</Label><Input {...register("page")} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Twitter / X</Label><Input {...register("twitter")} placeholder="https://twitter.com/..." /></div>
          <div><Label>ResearchGate</Label><Input {...register("researchgate")} placeholder="https://researchgate.net/..." /></div>
        </div>
      </div>

      <Button type="submit" disabled={loading || !photo} className="w-full">{loading ? "..." : isEdit ? (pt ? "Atualizar" : "Update") : (pt ? "Criar" : "Create")}</Button>
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
    resolver: zodResolver(studentSchema),
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
      if (!photo) return;
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
        if (!v.password) data.password = "changeme123";
      }
      onSubmit(data);
    })} className="space-y-6">
      <div className="space-y-4">
        <ProfilePhotoField photo={photo} setPhoto={setPhoto} pt={pt} />
        <div><Label>{pt ? "Nome" : "Name"}</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}</div>
        <div><Label>E-mail</Label><Input {...register("email")} />{errors.email && <p className="text-xs text-destructive mt-1">{pt ? "E-mail valido obrigatorio" : "Valid email required"}</p>}</div>
        {!isEdit && <div><Label>{pt ? "Senha" : "Password"}</Label><Input type="password" {...register("password")} placeholder={pt ? "Padrao: changeme123" : "Default: changeme123"} /></div>}
        <div>
          <Label>{pt ? "Situação no lab" : "Lab status"}</Label>
          <select {...register("role")} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm">
            <option value="aluno_ativo">{pt ? "Aluno ativo" : "Active student"}</option>
            <option value="alumni">{pt ? "Egresso" : "Alumni"}</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Nivel (EN)" : "Level (EN)"}</Label><Input {...register("level")} placeholder="PhD, MSc, Undergrad" />{errors.level && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}</div>
          <div><Label>{pt ? "Nivel (PT)" : "Level (PT)"}</Label><Input {...register("levelPt")} placeholder="Doutorado, Mestrado" />{errors.levelPt && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}</div>
        </div>
        <div>
          <Label>{pt ? "Orientador" : "Advisor"}</Label>
          <select {...register("advisor_id")} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm">
            <option value="">{pt ? "Selecione um orientador" : "Select an advisor"}</option>
            {docentes.map((docente) => (
              <option key={docente.id} value={docente.id}>{docente.name}</option>
            ))}
          </select>
          {errors.advisor_id && <p className="text-xs text-destructive mt-1">{requiredMessage(pt)}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Area (EN)" : "Area (EN)"}</Label><Input {...register("area")} /></div>
          <div><Label>{pt ? "Area (PT)" : "Area (PT)"}</Label><Input {...register("areaPt")} /></div>
        </div>
      </div>

      <RequiredProfileSection
        pt={pt}
        register={register as never}
        errors={errors as never}
        relationshipType={watch("lab_relationship_type")}
        affiliationName={watch("affiliation_name")}
        onAffiliationChange={(value) => setValue("affiliation_name", value, { shouldValidate: true })}
      />

      <div className="border-t border-border pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{pt ? "Perfil" : "Profile"}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Bio (EN)" : "Bio (EN)"}</Label><textarea {...register("bio")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
          <div><Label>{pt ? "Bio (PT)" : "Bio (PT)"}</Label><textarea {...register("bioPt")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
        </div>
        <div>
          <Label>{pt ? "Areas de pesquisa" : "Research areas"}</Label>
          <ProfileTermPicker kind="research_area" selected={researchAreas} onChange={setResearchAreas} isPt={pt} />
        </div>
        <div>
          <Label>{pt ? "Habilidades e tecnologias" : "Skills and technologies"}</Label>
          <ProfileTermPicker kind="skill" selected={skills} onChange={setSkills} isPt={pt} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Ano de ingresso" : "Year joined"}</Label><Input type="number" {...register("year_joined")} placeholder="2020" /></div>
          <div><Label>{pt ? "Numero USP" : "USP Number"}</Label><Input {...register("usp_number")} /></div>
        </div>
        {selectedRole === "alumni" && (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>{pt ? "Ano de formatura" : "Graduation year"}</Label><Input type="number" {...register("graduation_year")} placeholder="2024" /></div>
            <div><Label>{pt ? "Data de saída" : "Exit date"}</Label><Input type="date" {...register("exit_date")} /></div>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{pt ? "Redes Sociais" : "Social Links"}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>LinkedIn</Label><Input {...register("linkedin")} placeholder="https://linkedin.com/in/..." /></div>
          <div><Label>Twitter / X</Label><Input {...register("twitter")} placeholder="https://twitter.com/..." /></div>
        </div>
        <div><Label>ResearchGate</Label><Input {...register("researchgate")} placeholder="https://researchgate.net/..." /></div>
      </div>

      <Button type="submit" disabled={loading || !photo} className="w-full">{loading ? "..." : isEdit ? (pt ? "Atualizar" : "Update") : (pt ? "Criar" : "Create")}</Button>
    </form>
  );
};

export default PersonForm;
