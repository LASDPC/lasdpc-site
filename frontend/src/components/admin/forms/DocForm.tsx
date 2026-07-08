import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/services/docs";
import { normalizeDocPath } from "@/lib/docTree";
import MarkdownEditor from "./MarkdownEditor";

const schema = z.object({
  path: z
    .string()
    .min(1)
    .refine((v) => normalizeDocPath(v) !== null, { message: "invalid" }),
  content: z.string().min(1),
  updatedAt: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

interface DocFormProps {
  initial?: Doc;
  onSubmit: (data: Omit<Doc, "id">) => void;
  loading?: boolean;
  lang?: "en" | "pt";
}

const DOCS_PROSE = "prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-h2:text-xl prose-h3:text-lg prose-a:text-primary prose-code:text-primary";

const DocForm = ({ initial, onSubmit, loading, lang }: DocFormProps) => {
  const pt = lang === "pt";
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { path: "", content: "", updatedAt: new Date().toISOString().split("T")[0] },
  });

  const submit = (values: FormValues) => {
    onSubmit({ ...values, path: normalizeDocPath(values.path)! });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{pt ? "Caminho do arquivo" : "File path"}</Label>
          <Input {...register("path")} placeholder="reunioes/2026/ata.md" className="font-mono" />
          {errors.path && (
            <p className="text-xs text-destructive mt-1">
              {pt ? "Caminho inválido (ex.: reunioes/2026/ata.md)" : "Invalid path (e.g. meetings/2026/notes.md)"}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {pt
              ? "Use / para organizar em pastas — elas são criadas automaticamente."
              : "Use / to organize into folders — they are created automatically."}
          </p>
        </div>
        <div><Label>{pt ? "Atualizado em" : "Updated At"}</Label><Input type="date" {...register("updatedAt")} /></div>
      </div>
      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <MarkdownEditor label={pt ? "Conteúdo (Markdown)" : "Content (Markdown)"} value={field.value || ""} onChange={field.onChange} proseClassName={DOCS_PROSE} />
        )}
      />
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : initial ? (pt ? "Atualizar" : "Update") : (pt ? "Criar" : "Create")}</Button>
    </form>
  );
};

export default DocForm;
