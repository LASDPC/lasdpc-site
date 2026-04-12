import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Project } from "@/services/projects";
import MarkdownEditor from "./MarkdownEditor";

const schema = z.object({
  title: z.string().min(1),
  titlePt: z.string().min(1),
  description: z.string().min(1),
  descriptionPt: z.string().min(1),
  content: z.string().min(1),
  contentPt: z.string().min(1),
  status: z.enum(["active", "completed"]),
  tags: z.string(),
  publications: z.coerce.number().int().min(0),
  impact: z.enum(["High", "Medium"]),
});

type FormValues = z.infer<typeof schema>;

interface ProjectFormProps {
  initial?: Project;
  onSubmit: (data: Omit<Project, "id">) => void;
  loading?: boolean;
  lang?: "en" | "pt";
}

const ProjectForm = ({ initial, onSubmit, loading, lang }: ProjectFormProps) => {
  const pt = lang === "pt";
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? { ...initial, tags: initial.tags.join(", ") }
      : { status: "active", impact: "Medium", publications: 0, tags: "" },
  });

  const submit = (values: FormValues) => {
    onSubmit({
      ...values,
      tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>{pt ? "Título (EN)" : "Title (EN)"}</Label><Input {...register("title")} />{errors.title && <p className="text-xs text-destructive mt-1">{pt ? "Obrigatório" : "Required"}</p>}</div>
        <div><Label>{pt ? "Título (PT)" : "Title (PT)"}</Label><Input {...register("titlePt")} />{errors.titlePt && <p className="text-xs text-destructive mt-1">{pt ? "Obrigatório" : "Required"}</p>}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><Label>{pt ? "Descrição (EN)" : "Description (EN)"}</Label><textarea {...register("description")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
        <div><Label>{pt ? "Descrição (PT)" : "Description (PT)"}</Label><textarea {...register("descriptionPt")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><Label>Status</Label><select {...register("status")} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"><option value="active">{pt ? "Ativo" : "Active"}</option><option value="completed">{pt ? "Concluído" : "Completed"}</option></select></div>
        <div><Label>{pt ? "Impacto" : "Impact"}</Label><select {...register("impact")} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"><option value="High">{pt ? "Alto" : "High"}</option><option value="Medium">{pt ? "Médio" : "Medium"}</option></select></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>{pt ? "Tags (separadas por vírgula)" : "Tags (comma-separated)"}</Label><Input {...register("tags")} placeholder="HPC, AI, Cloud" /></div>
        <div><Label>{pt ? "Nº de publicações" : "Publications count"}</Label><Input type="number" {...register("publications")} /></div>
      </div>

      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <MarkdownEditor label={pt ? "Conteúdo EN (Markdown)" : "Content EN (Markdown)"} value={field.value || ""} onChange={field.onChange} />
        )}
      />
      <Controller
        name="contentPt"
        control={control}
        render={({ field }) => (
          <MarkdownEditor label={pt ? "Conteúdo PT (Markdown)" : "Content PT (Markdown)"} value={field.value || ""} onChange={field.onChange} />
        )}
      />
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : initial ? (pt ? "Atualizar" : "Update") : (pt ? "Criar" : "Create")}</Button>
    </form>
  );
};

export default ProjectForm;
