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
});

const studentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  level: z.string().optional(),
  levelPt: z.string().optional(),
  area: z.string().optional(),
  areaPt: z.string().optional(),
  password: z.string().optional(),
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

const PersonForm = (props: PersonFormProps) => {
  if (props.type === "student") {
    return <StudentFormInner {...props} />;
  }
  return <DocenteFormInner {...props} />;
};

const DocenteFormInner = ({ initial, onSubmit, loading, lang }: Omit<DocenteFormProps, "type">) => {
  const isEdit = !!initial;
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
    } : {},
  });

  const showEn = !lang || lang === "en";
  const showPt = !lang || lang === "pt";

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
      };
      if (!isEdit) {
        const names = v.name.trim().split(" ");
        data.initials = names.length >= 2
          ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
          : v.name.slice(0, 2).toUpperCase();
        if (!v.password) data.password = "changeme123";
      }
      onSubmit(data);
    })} className="space-y-4">
      <div><Label>Name</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive mt-1">Required</p>}</div>
      <div><Label>Email</Label><Input {...register("email")} />{errors.email && <p className="text-xs text-destructive mt-1">Valid email required</p>}</div>
      {!isEdit && <div><Label>Password</Label><Input type="password" {...register("password")} placeholder="Default: changeme123" /></div>}
      {showEn && showPt ? (
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Title (EN)</Label><Input {...register("title")} placeholder="Full Professor" /></div>
          <div><Label>Title (PT)</Label><Input {...register("titlePt")} placeholder="Professor Titular" /></div>
        </div>
      ) : showEn ? (
        <div><Label>Title</Label><Input {...register("title")} /></div>
      ) : (
        <div><Label>Title</Label><Input {...register("titlePt")} /></div>
      )}
      {showEn && showPt ? (
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Area (EN)</Label><Input {...register("area")} /></div>
          <div><Label>Area (PT)</Label><Input {...register("areaPt")} /></div>
        </div>
      ) : showEn ? (
        <div><Label>Area</Label><Input {...register("area")} /></div>
      ) : (
        <div><Label>Area</Label><Input {...register("areaPt")} /></div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Lattes URL</Label><Input {...register("lattes")} /></div>
        <div><Label>ORCID URL</Label><Input {...register("orcid")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Scholar URL</Label><Input {...register("scholar")} /></div>
        <div><Label>Page</Label><Input {...register("page")} /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : isEdit ? "Update" : "Create"}</Button>
    </form>
  );
};

const StudentFormInner = ({ initial, onSubmit, loading, lang }: Omit<StudentFormProps, "type">) => {
  const isEdit = !!initial;
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: initial ? {
      name: initial.name,
      email: initial.email,
      level: initial.level ?? "",
      levelPt: initial.levelPt ?? "",
      area: initial.area ?? "",
      areaPt: initial.areaPt ?? "",
    } : {},
  });

  const showEn = !lang || lang === "en";
  const showPt = !lang || lang === "pt";

  return (
    <form onSubmit={handleSubmit((v) => {
      const data: Record<string, unknown> = {
        ...v,
        role: "aluno_ativo",
      };
      if (!isEdit) {
        const names = v.name.trim().split(" ");
        data.initials = names.length >= 2
          ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
          : v.name.slice(0, 2).toUpperCase();
        if (!v.password) data.password = "changeme123";
      }
      onSubmit(data);
    })} className="space-y-4">
      <div><Label>Name</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive mt-1">Required</p>}</div>
      <div><Label>Email</Label><Input {...register("email")} />{errors.email && <p className="text-xs text-destructive mt-1">Valid email required</p>}</div>
      {!isEdit && <div><Label>Password</Label><Input type="password" {...register("password")} placeholder="Default: changeme123" /></div>}
      {showEn && showPt ? (
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Level (EN)</Label><Input {...register("level")} placeholder="PhD, MSc, Undergrad" /></div>
          <div><Label>Level (PT)</Label><Input {...register("levelPt")} placeholder="Doutorado, Mestrado" /></div>
        </div>
      ) : showEn ? (
        <div><Label>Level</Label><Input {...register("level")} placeholder="PhD, MSc, Undergrad" /></div>
      ) : (
        <div><Label>Level</Label><Input {...register("levelPt")} placeholder="Doutorado, Mestrado" /></div>
      )}
      {showEn && showPt ? (
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Area (EN)</Label><Input {...register("area")} /></div>
          <div><Label>Area (PT)</Label><Input {...register("areaPt")} /></div>
        </div>
      ) : showEn ? (
        <div><Label>Area</Label><Input {...register("area")} /></div>
      ) : (
        <div><Label>Area</Label><Input {...register("areaPt")} /></div>
      )}
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : isEdit ? "Update" : "Create"}</Button>
    </form>
  );
};

export default PersonForm;
