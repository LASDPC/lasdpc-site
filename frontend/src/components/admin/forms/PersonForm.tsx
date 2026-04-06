import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Docente, Student } from "@/services/people";

const docenteSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  rolePt: z.string().min(1),
  area: z.string().min(1),
  areaPt: z.string().min(1),
  email: z.string().email(),
  lattes: z.string().optional(),
  orcid: z.string().optional(),
  scholar: z.string().optional(),
  page: z.string().optional(),
  photo: z.string().optional(),
});

const studentSchema = z.object({
  name: z.string().min(1),
  level: z.string().min(1),
  levelPt: z.string().min(1),
  area: z.string().min(1),
  areaPt: z.string().min(1),
});

interface DocenteFormProps {
  type: "docente";
  initial?: Docente;
  onSubmit: (data: Omit<Docente, "id">) => void;
  loading?: boolean;
  lang?: "en" | "pt";
}

interface StudentFormProps {
  type: "student";
  initial?: Student;
  onSubmit: (data: Omit<Student, "id">) => void;
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
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof docenteSchema>>({
    resolver: zodResolver(docenteSchema),
    defaultValues: initial ? {
      ...initial,
      lattes: initial.lattes ?? "",
      orcid: initial.orcid ?? "",
      scholar: initial.scholar ?? "",
      page: initial.page ?? "",
      photo: initial.photo ?? "",
    } : {},
  });

  const showEn = !lang || lang === "en";
  const showPt = !lang || lang === "pt";

  return (
    <form onSubmit={handleSubmit((v) => onSubmit({ ...v, lattes: v.lattes || null, orcid: v.orcid || null, scholar: v.scholar || null, page: v.page || null, photo: v.photo || null }))} className="space-y-4">
      <div><Label>Name</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive mt-1">Required</p>}</div>
      {showEn && showPt ? (
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Role (EN)</Label><Input {...register("role")} /></div>
          <div><Label>Role (PT)</Label><Input {...register("rolePt")} /></div>
        </div>
      ) : showEn ? (
        <div><Label>Role</Label><Input {...register("role")} /></div>
      ) : (
        <div><Label>Role</Label><Input {...register("rolePt")} /></div>
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
      <div><Label>Email</Label><Input {...register("email")} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Lattes URL</Label><Input {...register("lattes")} /></div>
        <div><Label>ORCID URL</Label><Input {...register("orcid")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Scholar URL</Label><Input {...register("scholar")} /></div>
        <div><Label>Page</Label><Input {...register("page")} /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : initial ? "Update" : "Create"}</Button>
    </form>
  );
};

const StudentFormInner = ({ initial, onSubmit, loading, lang }: Omit<StudentFormProps, "type">) => {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: initial ?? {},
  });

  const showEn = !lang || lang === "en";
  const showPt = !lang || lang === "pt";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div><Label>Name</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive mt-1">Required</p>}</div>
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
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : initial ? "Update" : "Create"}</Button>
    </form>
  );
};

export default PersonForm;
