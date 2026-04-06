import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Cluster } from "@/services/infrastructure";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  descriptionPt: z.string().min(1),
  cpuUsage: z.coerce.number().int().min(0).max(100),
  gpuUsage: z.coerce.number().int().min(0).max(100),
  memoryUsage: z.coerce.number().int().min(0).max(100),
  storageUsage: z.coerce.number().int().min(0).max(100),
  status: z.enum(["online", "maintenance"]),
});

type FormValues = z.infer<typeof schema>;

interface InfraClusterFormProps {
  initial?: Cluster;
  onSubmit: (data: Omit<Cluster, "id">) => void;
  loading?: boolean;
  lang?: "en" | "pt";
}

const InfraClusterForm = ({ initial, onSubmit, loading, lang }: InfraClusterFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { cpuUsage: 0, gpuUsage: 0, memoryUsage: 0, storageUsage: 0, status: "online" },
  });

  const showEn = !lang || lang === "en";
  const showPt = !lang || lang === "pt";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div><Label>Name</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive mt-1">Required</p>}</div>
      {showEn && showPt ? (
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Description (EN)</Label><textarea {...register("description")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
          <div><Label>Description (PT)</Label><textarea {...register("descriptionPt")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
        </div>
      ) : showEn ? (
        <div><Label>Description</Label><textarea {...register("description")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
      ) : (
        <div><Label>Description</Label><textarea {...register("descriptionPt")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
      )}
      <div><Label>Status</Label><select {...register("status")} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"><option value="online">Online</option><option value="maintenance">Maintenance</option></select></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>CPU Usage %</Label><Input type="number" {...register("cpuUsage")} /></div>
        <div><Label>GPU Usage %</Label><Input type="number" {...register("gpuUsage")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Memory Usage %</Label><Input type="number" {...register("memoryUsage")} /></div>
        <div><Label>Storage Usage %</Label><Input type="number" {...register("storageUsage")} /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : initial ? "Update" : "Create"}</Button>
    </form>
  );
};

export default InfraClusterForm;
