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
});

type FormValues = z.infer<typeof schema>;

interface PublicationFormProps {
  initial?: Publication;
  onSubmit: (data: Omit<Publication, "id">) => void;
  loading?: boolean;
  lang?: "en" | "pt";
}

const PublicationForm = ({ initial, onSubmit, loading, lang }: PublicationFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { year: new Date().getFullYear() },
  });

  const showEn = !lang || lang === "en";
  const showPt = !lang || lang === "pt";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {showEn && showPt ? (
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Title (EN)</Label><Input {...register("title")} />{errors.title && <p className="text-xs text-destructive mt-1">Required</p>}</div>
          <div><Label>Title (PT)</Label><Input {...register("titlePt")} /></div>
        </div>
      ) : showEn ? (
        <div><Label>Title</Label><Input {...register("title")} />{errors.title && <p className="text-xs text-destructive mt-1">Required</p>}</div>
      ) : (
        <div><Label>Title</Label><Input {...register("titlePt")} />{errors.titlePt && <p className="text-xs text-destructive mt-1">Required</p>}</div>
      )}
      <div><Label>Authors</Label><Input {...register("authors")} placeholder="A. Silva, B. Costa" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Venue</Label><Input {...register("venue")} /></div>
        <div><Label>Year</Label><Input type="number" {...register("year")} /></div>
      </div>
      <div><Label>DOI URL</Label><Input {...register("doi")} /></div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : initial ? "Update" : "Create"}</Button>
    </form>
  );
};

export default PublicationForm;
