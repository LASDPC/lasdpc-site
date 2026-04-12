import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { Cluster } from "@/services/infrastructure";
import type { CustomFieldDef } from "@/services/clusterRequests";

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

const FIELD_TYPES = ["text", "number", "select", "checkbox", "date"] as const;

const emptyField = (): CustomFieldDef => ({
  name: "",
  label: "",
  labelPt: "",
  type: "text",
  options: [],
  required: false,
});

const InfraClusterForm = ({ initial, onSubmit, loading, lang }: InfraClusterFormProps) => {
  const pt = lang === "pt";
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { cpuUsage: 0, gpuUsage: 0, memoryUsage: 0, storageUsage: 0, status: "online" },
  });

  const [customFields, setCustomFields] = useState<CustomFieldDef[]>(
    initial?.custom_fields ?? []
  );

  const addField = () => setCustomFields((prev) => [...prev, emptyField()]);

  const removeField = (idx: number) =>
    setCustomFields((prev) => prev.filter((_, i) => i !== idx));

  const updateField = (idx: number, patch: Partial<CustomFieldDef>) =>
    setCustomFields((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, ...patch } : f))
    );

  const submit = (values: FormValues) => {
    onSubmit({
      ...values,
      custom_fields: customFields.filter((f) => f.name && f.label),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div><Label>{pt ? "Nome" : "Name"}</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive mt-1">{pt ? "Obrigatório" : "Required"}</p>}</div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>{pt ? "Descrição (EN)" : "Description (EN)"}</Label><textarea {...register("description")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
        <div><Label>{pt ? "Descrição (PT)" : "Description (PT)"}</Label><textarea {...register("descriptionPt")} className="w-full min-h-[80px] bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></div>
      </div>
      <div><Label>Status</Label><select {...register("status")} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"><option value="online">Online</option><option value="maintenance">{pt ? "Manutenção" : "Maintenance"}</option></select></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>{pt ? "Uso de CPU %" : "CPU Usage %"}</Label><Input type="number" {...register("cpuUsage")} /></div>
        <div><Label>{pt ? "Uso de GPU %" : "GPU Usage %"}</Label><Input type="number" {...register("gpuUsage")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>{pt ? "Uso de Memória %" : "Memory Usage %"}</Label><Input type="number" {...register("memoryUsage")} /></div>
        <div><Label>{pt ? "Uso de Armazenamento %" : "Storage Usage %"}</Label><Input type="number" {...register("storageUsage")} /></div>
      </div>

      {/* ---- Custom Fields Editor ---- */}
      <div className="border-t border-border pt-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground">
            {pt ? "Campos do formulário de solicitação" : "Request form fields"}
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            <Plus size={14} className="mr-1" />
            {pt ? "Adicionar campo" : "Add field"}
          </Button>
        </div>

        {customFields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {pt
              ? "Nenhum campo extra. Usuários verão apenas cluster, datas e observação."
              : "No extra fields. Users will only see cluster, dates, and observation."}
          </p>
        )}

        <div className="space-y-4">
          {customFields.map((field, idx) => (
            <div key={idx} className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {pt ? `Campo ${idx + 1}` : `Field ${idx + 1}`}
                </span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeField(idx)}>
                  <Trash2 size={14} />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{pt ? "Nome interno" : "Internal name"}</Label>
                  <Input
                    value={field.name}
                    onChange={(e) => updateField(idx, { name: e.target.value.replace(/\s/g, "_").toLowerCase() })}
                    placeholder="gpu_count"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">{pt ? "Rótulo (EN)" : "Label (EN)"}</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(idx, { label: e.target.value })}
                    placeholder="GPU Count"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">{pt ? "Rótulo (PT)" : "Label (PT)"}</Label>
                  <Input
                    value={field.labelPt}
                    onChange={(e) => updateField(idx, { labelPt: e.target.value })}
                    placeholder="Qtd. GPUs"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{pt ? "Tipo" : "Type"}</Label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(idx, { type: e.target.value as CustomFieldDef["type"] })}
                    className="w-full bg-secondary border border-border rounded-md px-3 py-1.5 text-sm"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(idx, { required: e.target.checked })}
                      className="rounded border-border"
                    />
                    {pt ? "Obrigatório" : "Required"}
                  </label>
                </div>
              </div>
              {field.type === "select" && (
                <div>
                  <Label className="text-xs">{pt ? "Opções (separadas por vírgula)" : "Options (comma-separated)"}</Label>
                  <Input
                    value={field.options.join(", ")}
                    onChange={(e) =>
                      updateField(idx, {
                        options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Option A, Option B, Option C"
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full mt-6">
        {loading ? "..." : initial ? (pt ? "Atualizar" : "Update") : (pt ? "Criar" : "Create")}
      </Button>
    </form>
  );
};

export default InfraClusterForm;
