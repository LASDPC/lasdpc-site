import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/services/blog";

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
});

type FormValues = z.infer<typeof schema>;

interface BlogFormProps {
  initial?: BlogPost;
  onSubmit: (data: Omit<BlogPost, "id">) => void;
  loading?: boolean;
}

const BlogForm = ({ initial, onSubmit, loading }: BlogFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { date: new Date().toISOString().split("T")[0] },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Title (EN)</Label><Input {...register("title")} />{errors.title && <p className="text-xs text-destructive mt-1">Required</p>}</div>
        <div><Label>Title (PT)</Label><Input {...register("titlePt")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Excerpt (EN)</Label><textarea {...register("excerpt")} className="w-full min-h-[60px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
        <div><Label>Excerpt (PT)</Label><textarea {...register("excerptPt")} className="w-full min-h-[60px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Content (EN, Markdown)</Label><textarea {...register("content")} className="w-full min-h-[120px] bg-secondary border border-border rounded-md px-3 py-2 text-sm font-mono" /></div>
        <div><Label>Content (PT, Markdown)</Label><textarea {...register("contentPt")} className="w-full min-h-[120px] bg-secondary border border-border rounded-md px-3 py-2 text-sm font-mono" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><Label>Date</Label><Input type="date" {...register("date")} /></div>
        <div><Label>Tag</Label><Input {...register("tag")} placeholder="Conference" /></div>
        <div><Label>Author</Label><Input {...register("author")} /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : initial ? "Update" : "Create"}</Button>
    </form>
  );
};

export default BlogForm;
