import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { profileTermsService, type ProfileTermKind } from "@/services/profileTerms";

const normalize = (value: string) => value.trim().toLocaleLowerCase();

type ProfileTermPickerProps = {
  kind: ProfileTermKind;
  selected: string[];
  onChange: (values: string[]) => void;
  isPt: boolean;
  relationshipType?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  customPlaceholder?: string;
  addLabel?: string;
};

export default function ProfileTermPicker({
  kind,
  selected,
  onChange,
  isPt,
  relationshipType,
  emptyText,
  searchPlaceholder,
  customPlaceholder,
  addLabel,
}: ProfileTermPickerProps) {
  const [query, setQuery] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["profile-terms", kind, query, relationshipType],
    queryFn: () => profileTermsService.list(kind, query, relationshipType),
  });

  const selectedKeys = useMemo(() => new Set(selected.map(normalize)), [selected]);
  const options = useMemo(
    () => suggestions.map((item) => item.value).filter((value) => !selectedKeys.has(normalize(value))),
    [suggestions, selectedKeys],
  );

  const addValue = (value: string) => {
    const clean = value.trim();
    if (!clean || selectedKeys.has(normalize(clean))) return;
    onChange([...selected, clean].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })));
    setQuery("");
    setCustomValue("");
    setAddingCustom(false);
  };

  const removeValue = (value: string) => {
    onChange(selected.filter((item) => normalize(item) !== normalize(value)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selected.length > 0 ? (
          selected.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => removeValue(value)}
              className="inline-flex min-h-8 items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
            >
              {value}
              <X size={13} />
            </button>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">
            {emptyText ?? (isPt ? "Nenhum item selecionado ainda." : "No items selected yet.")}
          </span>
        )}
      </div>

      <div className="rounded-lg border border-border bg-secondary/35 p-3">
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder ?? (isPt ? "Buscar existente" : "Search existing")}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {options.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => addValue(value)}
              className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus size={13} />
              {value}
            </button>
          ))}
          {options.length === 0 && (
            <span className="text-xs text-muted-foreground">
              {isPt ? "Nenhuma sugestao encontrada." : "No matching suggestions."}
            </span>
          )}
        </div>

        <div className="mt-3 border-t border-border pt-3">
          {addingCustom ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={customValue}
                onChange={(event) => setCustomValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addValue(customValue);
                  }
                }}
                placeholder={customPlaceholder ?? (isPt ? "Novo item" : "New item")}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => addValue(customValue)} className="shrink-0">
                  <Check size={14} className="mr-2" />
                  {isPt ? "Adicionar" : "Add"}
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setAddingCustom(false)} aria-label={isPt ? "Cancelar" : "Cancel"}>
                  <X size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setAddingCustom(true)}>
              <Plus size={14} className="mr-2" />
              {addLabel ?? (isPt ? "Adicionar novo" : "Add new")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
