import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Publication } from "@/services/publications";

const schema = z.object({
  title: z.string().min(1),
  titlePt: z.string().min(1),
  authors: z.string().min(1),
  venue: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(2100),
  doi: z.string().min(1),
  // New filter-friendly fields (mirroring ProjectForm so research search has
  // the same axes for both resources).
  tags: z.string(),
  type: z.enum([
    "article",
    "conference",
    "journal",
    "book",
    "chapter",
    "thesis",
    "preprint",
    "other",
  ]),
  status: z.enum(["published", "preprint", "under-review", "in-press"]),
  impact: z.enum(["High", "Medium", "Low"]),
  area: z.string().optional(),
  areaPt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PublicationFormProps {
  initial?: Publication;
  onSubmit: (data: Omit<Publication, "id">) => void;
  loading?: boolean;
  lang?: "en" | "pt";
}

const PublicationForm = ({ initial, onSubmit, loading, lang }: PublicationFormProps) => {
  const pt = lang === "pt";
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          ...initial,
          tags: (initial.tags ?? []).join(", "),
          type: initial.type ?? "article",
          status: initial.status ?? "published",
          impact: initial.impact ?? "Medium",
          area: initial.area ?? "",
          areaPt: initial.areaPt ?? "",
        }
      : {
          year: new Date().getFullYear(),
          tags: "",
          type: "article",
          status: "published",
          impact: "Medium",
          area: "",
          areaPt: "",
        },
  });

  const submit = (values: FormValues) => {
    onSubmit({
      ...values,
      tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean),
      area: values.area?.trim() || null,
      areaPt: values.areaPt?.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{pt ? "Título (EN)" : "Title (EN)"}</Label>
          <Input {...register("title")} />
          {errors.title && <p className="text-xs text-destructive mt-1">{pt ? "Obrigatório" : "Required"}</p>}
        </div>
        <div>
          <Label>{pt ? "Título (PT)" : "Title (PT)"}</Label>
          <Input {...register("titlePt")} />
          {errors.titlePt && <p className="text-xs text-destructive mt-1">{pt ? "Obrigatório" : "Required"}</p>}
        </div>
      </div>

      <div>
        <Label>{pt ? "Autores" : "Authors"}</Label>
        <Input {...register("authors")} placeholder="A. Silva, B. Costa" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{pt ? "Veículo" : "Venue"}</Label>
          <Input {...register("venue")} />
        </div>
        <div>
          <Label>{pt ? "Ano" : "Year"}</Label>
          <Input type="number" {...register("year")} />
        </div>
      </div>

      <div>
        <Label>DOI URL</Label>
        <Input {...register("doi")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{pt ? "Tipo" : "Type"}</Label>
          <select
            {...register("type")}
            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="article">{pt ? "Artigo" : "Article"}</option>
            <option value="conference">{pt ? "Conferência" : "Conference"}</option>
            <option value="journal">{pt ? "Periódico" : "Journal"}</option>
            <option value="book">{pt ? "Livro" : "Book"}</option>
            <option value="chapter">{pt ? "Capítulo" : "Chapter"}</option>
            <option value="thesis">{pt ? "Tese/Dissertação" : "Thesis"}</option>
            <option value="preprint">Preprint</option>
            <option value="other">{pt ? "Outro" : "Other"}</option>
          </select>
        </div>
        <div>
          <Label>Status</Label>
          <select
            {...register("status")}
            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="published">{pt ? "Publicado" : "Published"}</option>
            <option value="preprint">Preprint</option>
            <option value="under-review">{pt ? "Em revisão" : "Under review"}</option>
            <option value="in-press">{pt ? "No prelo" : "In press"}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{pt ? "Impacto" : "Impact"}</Label>
          <select
            {...register("impact")}
            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="High">{pt ? "Alto" : "High"}</option>
            <option value="Medium">{pt ? "Médio" : "Medium"}</option>
            <option value="Low">{pt ? "Baixo" : "Low"}</option>
          </select>
        </div>
        <div>
          <Label>{pt ? "Tags (separadas por vírgula)" : "Tags (comma-separated)"}</Label>
          <Input {...register("tags")} placeholder="HPC, AI, Cloud" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{pt ? "Área (EN)" : "Area (EN)"}</Label>
          <Input {...register("area")} placeholder="Distributed Systems" />
        </div>
        <div>
          <Label>{pt ? "Área (PT)" : "Area (PT)"}</Label>
          <Input {...register("areaPt")} placeholder="Sistemas Distribuídos" />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "..." : initial ? (pt ? "Atualizar" : "Update") : (pt ? "Criar" : "Create")}
      </Button>
    </form>
  );
};

export default PublicationForm;
