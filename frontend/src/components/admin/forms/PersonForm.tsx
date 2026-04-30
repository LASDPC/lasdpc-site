import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { User } from "@/services/auth";

const docenteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  title: z.string().optional(),
  titlePt: z.string().optional(),
  area: z.string().optional(),
  areaPt: z.string().optional(),
  lattes: z.string().optional(),
  orcid: z.string().optional(),
  scholar: z.string().optional(),
  page: z.string().optional(),
  password: z.string().optional(),
  // Enriched profile
  bio: z.string().optional(),
  bioPt: z.string().optional(),
  research_areas: z.string().optional(),
  year_joined: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  skills: z.string().optional(),
  // Social links
  linkedin: z.string().optional(),
  github: z.string().optional(),
  twitter: z.string().optional(),
  researchgate: z.string().optional(),
  // USP
  usp_number: z.string().optional(),
});

const studentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  level: z.string().optional(),
  levelPt: z.string().optional(),
  area: z.string().optional(),
  areaPt: z.string().optional(),
  password: z.string().optional(),
  // Enriched profile
  bio: z.string().optional(),
  bioPt: z.string().optional(),
  research_areas: z.string().optional(),
  year_joined: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  skills: z.string().optional(),
  graduation_year: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  // Social links
  linkedin: z.string().optional(),
  github: z.string().optional(),
  twitter: z.string().optional(),
  researchgate: z.string().optional(),
  // USP
  usp_number: z.string().optional(),
});

interface DocenteFormProps {
  type: "docente";
  initial?: User;
  onSubmit: (data: Record<string, unknown>) => void;
  loading?: boolean;
  lang?: "en" | "pt";
}

interface StudentFormProps {
  type: "student";
  initial?: User;
  onSubmit: (data: Record<string, unknown>) => void;
  loading?: boolean;
  lang?: "en" | "pt";
}

type PersonFormProps = DocenteFormProps | StudentFormProps;

function splitCsv(val?: string): string[] | null {
  if (!val) return null;
  const arr = val.split(",").map(s => s.trim()).filter(Boolean);
  return arr.length > 0 ? arr : null;
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
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof docenteSchema>>({
    resolver: zodResolver(docenteSchema),
    defaultValues: initial ? {
      name: initial.name,
      email: initial.email,
      title: initial.title ?? "",
      titlePt: initial.titlePt ?? "",
      area: initial.area ?? "",
      areaPt: initial.areaPt ?? "",
      lattes: initial.lattes ?? "",
      orcid: initial.orcid ?? "",
      scholar: initial.scholar ?? "",
      page: initial.page ?? "",
      bio: initial.bio ?? "",
      bioPt: initial.bioPt ?? "",
      research_areas: initial.research_areas?.join(", ") ?? "",
      year_joined: initial.year_joined ?? ("" as unknown as undefined),
      skills: initial.skills?.join(", ") ?? "",
      linkedin: initial.linkedin ?? "",
      github: initial.github ?? "",
      twitter: initial.twitter ?? "",
      researchgate: initial.researchgate ?? "",
      usp_number: initial.usp_number ?? "",
    } : {},
  });

  return (
    <form onSubmit={handleSubmit((v) => {
      const data: Record<string, unknown> = {
        ...v,
        role: "docente",
        lattes: v.lattes || null,
        orcid: v.orcid || null,
        scholar: v.scholar || null,
        page: v.page || null,
        title: v.title || null,
        titlePt: v.titlePt || null,
        bio: v.bio || null,
        bioPt: v.bioPt || null,
        research_areas: splitCsv(v.research_areas),
        year_joined: v.year_joined || null,
        skills: splitCsv(v.skills),
        linkedin: v.linkedin || null,
        github: v.github || null,
        twitter: v.twitter || null,
        researchgate: v.researchgate || null,
        usp_number: v.usp_number || null,
      };
      if (!isEdit) {
        const names = v.name.trim().split(" ");
        data.initials = names.length >= 2
          ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
          : v.name.slice(0, 2).toUpperCase();
        if (!v.password) data.password = "changeme123";
      }
      onSubmit(data);
    })} className="space-y-6">
      {/* Basic info */}
      <div className="space-y-4">
        <div><Label>{pt ? "Nome" : "Name"}</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive mt-1">{pt ? "Obrigatorio" : "Required"}</p>}</div>
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
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Lattes URL</Label><Input {...register("lattes")} /></div>
          <div><Label>ORCID URL</Label><Input {...register("orcid")} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Scholar URL</Label><Input {...register("scholar")} /></div>
          <div><Label>{pt ? "Pagina pessoal" : "Personal page"}</Label><Input {...register("page")} /></div>
        </div>
      </div>

      {/* Profile section */}
      <div className="border-t border-border pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{pt ? "Perfil" : "Profile"}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Bio (EN)" : "Bio (EN)"}</Label><textarea {...register("bio")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
          <div><Label>{pt ? "Bio (PT)" : "Bio (PT)"}</Label><textarea {...register("bioPt")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
        </div>
        <div><Label>{pt ? "Areas de pesquisa" : "Research areas"}</Label><Input {...register("research_areas")} placeholder={pt ? "Separe por virgulas: HPC, ML, Cloud" : "Comma-separated: HPC, ML, Cloud"} /></div>
        <div><Label>{pt ? "Habilidades" : "Skills"}</Label><Input {...register("skills")} placeholder={pt ? "Separe por virgulas: Python, CUDA, MPI" : "Comma-separated: Python, CUDA, MPI"} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Ano de ingresso" : "Year joined"}</Label><Input type="number" {...register("year_joined")} placeholder="2020" /></div>
          <div><Label>{pt ? "Numero USP" : "USP Number"}</Label><Input {...register("usp_number")} /></div>
        </div>
      </div>

      {/* Social links section */}
      <div className="border-t border-border pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{pt ? "Redes Sociais" : "Social Links"}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>LinkedIn</Label><Input {...register("linkedin")} placeholder="https://linkedin.com/in/..." /></div>
          <div><Label>GitHub</Label><Input {...register("github")} placeholder="https://github.com/..." /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Twitter / X</Label><Input {...register("twitter")} placeholder="https://twitter.com/..." /></div>
          <div><Label>ResearchGate</Label><Input {...register("researchgate")} placeholder="https://researchgate.net/..." /></div>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : isEdit ? (pt ? "Atualizar" : "Update") : (pt ? "Criar" : "Create")}</Button>
    </form>
  );
};

const StudentFormInner = ({ initial, onSubmit, loading, lang }: Omit<StudentFormProps, "type">) => {
  const isEdit = !!initial;
  const pt = lang === "pt";
  const { register, handleSubmit, watch, formState: { errors } } = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: initial ? {
      name: initial.name,
      email: initial.email,
      level: initial.level ?? "",
      levelPt: initial.levelPt ?? "",
      area: initial.area ?? "",
      areaPt: initial.areaPt ?? "",
      bio: initial.bio ?? "",
      bioPt: initial.bioPt ?? "",
      research_areas: initial.research_areas?.join(", ") ?? "",
      year_joined: initial.year_joined ?? ("" as unknown as undefined),
      skills: initial.skills?.join(", ") ?? "",
      graduation_year: initial.graduation_year ?? ("" as unknown as undefined),
      linkedin: initial.linkedin ?? "",
      github: initial.github ?? "",
      twitter: initial.twitter ?? "",
      researchgate: initial.researchgate ?? "",
      usp_number: initial.usp_number ?? "",
    } : {},
  });

  const currentRole = initial?.role;
  const showGraduationYear = currentRole === "alumni";

  // Watch is not used for role here but keeping watch available
  void watch;

  return (
    <form onSubmit={handleSubmit((v) => {
      const data: Record<string, unknown> = {
        ...v,
        role: "aluno_ativo",
        bio: v.bio || null,
        bioPt: v.bioPt || null,
        research_areas: splitCsv(v.research_areas),
        year_joined: v.year_joined || null,
        skills: splitCsv(v.skills),
        graduation_year: v.graduation_year || null,
        linkedin: v.linkedin || null,
        github: v.github || null,
        twitter: v.twitter || null,
        researchgate: v.researchgate || null,
        usp_number: v.usp_number || null,
      };
      if (!isEdit) {
        const names = v.name.trim().split(" ");
        data.initials = names.length >= 2
          ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
          : v.name.slice(0, 2).toUpperCase();
        if (!v.password) data.password = "changeme123";
      }
      onSubmit(data);
    })} className="space-y-6">
      {/* Basic info */}
      <div className="space-y-4">
        <div><Label>{pt ? "Nome" : "Name"}</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive mt-1">{pt ? "Obrigatorio" : "Required"}</p>}</div>
        <div><Label>E-mail</Label><Input {...register("email")} />{errors.email && <p className="text-xs text-destructive mt-1">{pt ? "E-mail valido obrigatorio" : "Valid email required"}</p>}</div>
        {!isEdit && <div><Label>{pt ? "Senha" : "Password"}</Label><Input type="password" {...register("password")} placeholder={pt ? "Padrao: changeme123" : "Default: changeme123"} /></div>}
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Nivel (EN)" : "Level (EN)"}</Label><Input {...register("level")} placeholder="PhD, MSc, Undergrad" /></div>
          <div><Label>{pt ? "Nivel (PT)" : "Level (PT)"}</Label><Input {...register("levelPt")} placeholder="Doutorado, Mestrado" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Area (EN)" : "Area (EN)"}</Label><Input {...register("area")} /></div>
          <div><Label>{pt ? "Area (PT)" : "Area (PT)"}</Label><Input {...register("areaPt")} /></div>
        </div>
      </div>

      {/* Profile section */}
      <div className="border-t border-border pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{pt ? "Perfil" : "Profile"}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Bio (EN)" : "Bio (EN)"}</Label><textarea {...register("bio")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
          <div><Label>{pt ? "Bio (PT)" : "Bio (PT)"}</Label><textarea {...register("bioPt")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
        </div>
        <div><Label>{pt ? "Areas de pesquisa" : "Research areas"}</Label><Input {...register("research_areas")} placeholder={pt ? "Separe por virgulas: HPC, ML, Cloud" : "Comma-separated: HPC, ML, Cloud"} /></div>
        <div><Label>{pt ? "Habilidades" : "Skills"}</Label><Input {...register("skills")} placeholder={pt ? "Separe por virgulas: Python, CUDA, MPI" : "Comma-separated: Python, CUDA, MPI"} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>{pt ? "Ano de ingresso" : "Year joined"}</Label><Input type="number" {...register("year_joined")} placeholder="2020" /></div>
          <div><Label>{pt ? "Numero USP" : "USP Number"}</Label><Input {...register("usp_number")} /></div>
        </div>
        {showGraduationYear && (
          <div><Label>{pt ? "Ano de formatura" : "Graduation year"}</Label><Input type="number" {...register("graduation_year")} placeholder="2024" /></div>
        )}
      </div>

      {/* Social links section */}
      <div className="border-t border-border pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{pt ? "Redes Sociais" : "Social Links"}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>LinkedIn</Label><Input {...register("linkedin")} placeholder="https://linkedin.com/in/..." /></div>
          <div><Label>GitHub</Label><Input {...register("github")} placeholder="https://github.com/..." /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Twitter / X</Label><Input {...register("twitter")} placeholder="https://twitter.com/..." /></div>
          <div><Label>ResearchGate</Label><Input {...register("researchgate")} placeholder="https://researchgate.net/..." /></div>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : isEdit ? (pt ? "Atualizar" : "Update") : (pt ? "Criar" : "Create")}</Button>
    </form>
  );
};

export default PersonForm;
