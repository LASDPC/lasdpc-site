import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/services/docs";
import MarkdownEditor from "./MarkdownEditor";

const schema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  titlePt: z.string().min(1),
  content: z.string().min(1),
  contentPt: z.string().min(1),
  updatedAt: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

interface DocFormProps {
  initial?: Doc;
  onSubmit: (data: Omit<Doc, "id">) => void;
  loading?: boolean;
}

const DOCS_PROSE = "prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-h2:text-xl prose-h3:text-lg prose-a:text-primary prose-code:text-primary";

const DocForm = ({ initial, onSubmit, loading }: DocFormProps) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { updatedAt: new Date().toISOString().split("T")[0], category: "guides" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Category</Label><select {...register("category")} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"><option value="guides">Guides</option><option value="policies">Policies</option><option value="tutorials">Tutorials</option></select></div>
        <div><Label>Updated At</Label><Input type="date" {...register("updatedAt")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Title (EN)</Label><Input {...register("title")} />{errors.title && <p className="text-xs text-destructive mt-1">Required</p>}</div>
        <div><Label>Title (PT)</Label><Input {...register("titlePt")} /></div>
      </div>
      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <MarkdownEditor label="Content (EN, Markdown)" value={field.value || ""} onChange={field.onChange} proseClassName={DOCS_PROSE} />
        )}
      />
      <Controller
        name="contentPt"
        control={control}
        render={({ field }) => (
          <MarkdownEditor label="Content (PT, Markdown)" value={field.value || ""} onChange={field.onChange} proseClassName={DOCS_PROSE} />
        )}
      />
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : initial ? "Update" : "Create"}</Button>
    </form>
  );
};

export default DocForm;
