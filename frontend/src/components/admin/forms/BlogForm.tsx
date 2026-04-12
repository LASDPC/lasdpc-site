import { useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import type { BlogPost } from "@/services/blog";
import MarkdownEditor from "./MarkdownEditor";

const schema = z.object({
  title: z.string().min(1),
  titlePt: z.string().min(1),
  excerpt: z.string().min(1),
  excerptPt: z.string().min(1),
  content: z.string().min(1),
  contentPt: z.string().min(1),
  date: z.string().min(1),
  tag: z.string().min(1),
  author: z.string().min(1),
  coverImage: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface BlogFormProps {
  initial?: BlogPost;
  onSubmit: (data: Omit<BlogPost, "id">) => void;
  loading?: boolean;
  lang?: "en" | "pt";
}

const BlogForm = ({ initial, onSubmit, loading, lang }: BlogFormProps) => {
  const pt = lang === "pt";
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { date: new Date().toISOString().split("T")[0] },
  });

  const coverImage = watch("coverImage");
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setValue("coverImage", ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>{pt ? "Título (EN)" : "Title (EN)"}</Label><Input {...register("title")} />{errors.title && <p className="text-xs text-destructive mt-1">{pt ? "Obrigatório" : "Required"}</p>}</div>
        <div><Label>{pt ? "Título (PT)" : "Title (PT)"}</Label><Input {...register("titlePt")} />{errors.titlePt && <p className="text-xs text-destructive mt-1">{pt ? "Obrigatório" : "Required"}</p>}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><Label>{pt ? "Resumo (EN)" : "Excerpt (EN)"}</Label><textarea {...register("excerpt")} className="w-full min-h-[60px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
        <div><Label>{pt ? "Resumo (PT)" : "Excerpt (PT)"}</Label><textarea {...register("excerptPt")} className="w-full min-h-[60px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
      </div>

      {/* Cover Image */}
      <div>
        <Label>{pt ? "Imagem de capa" : "Cover Image"}</Label>
        <div className="flex items-center gap-3 mt-1">
          {coverImage ? (
            <div className="relative">
              <img src={coverImage} alt={pt ? "Prévia da capa" : "Cover preview"} className="h-24 rounded-md object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={() => setValue("coverImage", undefined)}
              >
                <X size={12} />
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => coverInputRef.current?.click()}>
              <ImagePlus size={14} className="mr-2" /> {pt ? "Enviar capa" : "Upload Cover"}
            </Button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCoverUpload(file);
              e.target.value = "";
            }}
          />
        </div>
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

      <div className="grid grid-cols-3 gap-4">
        <div><Label>{pt ? "Data" : "Date"}</Label><Input type="date" {...register("date")} /></div>
        <div><Label>Tag</Label><Input {...register("tag")} placeholder={pt ? "Conferência" : "Conference"} /></div>
        <div><Label>{pt ? "Autor" : "Author"}</Label><Input {...register("author")} /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : initial ? (pt ? "Atualizar" : "Update") : (pt ? "Criar" : "Create")}</Button>
    </form>
  );
};

export default BlogForm;
