import { useMemo, useState, type InputHTMLAttributes } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { normalizeSearchText } from "@/lib/search";
import { cn } from "@/lib/utils";

type FilterComboboxOption =
  | string
  | {
      value: string;
      label?: string;
      searchText?: string;
    };

interface FilterComboboxProps {
  value: string;
  options: FilterComboboxOption[];
  onChange: (value: string, replace?: boolean) => void;
  labels: {
    placeholder: string;
    clear: string;
    noResults: string;
  };
  className?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}

const optionValue = (option: FilterComboboxOption) =>
  typeof option === "string" ? option : option.value;

const optionLabel = (option: FilterComboboxOption) =>
  typeof option === "string" ? option : option.label ?? option.value;

const optionSearchText = (option: FilterComboboxOption) =>
  typeof option === "string"
    ? option
    : [option.value, option.label, option.searchText].filter(Boolean).join(" ");

const FilterCombobox = ({
  value,
  options,
  onChange,
  labels,
  className,
  inputMode,
}: FilterComboboxProps) => {
  const [open, setOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(value).trim();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      normalizeSearchText(optionSearchText(option)).includes(normalizedQuery),
    );
  }, [options, value]);

  const selectOption = (option: FilterComboboxOption) => {
    onChange(optionValue(option));
    setOpen(false);
  };

  return (
    <div
      className={cn("relative min-w-[150px] flex-1", className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          inputMode={inputMode}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value, true);
            setOpen(true);
          }}
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          className="h-12 rounded-xl border-border bg-background/75 pl-9 pr-20 shadow-none transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
        />
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onChange("", true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label={labels.clear}
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setOpen((current) => !current)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={labels.placeholder}
          >
            <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-80 overflow-auto rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-[0_20px_50px_-20px_hsl(var(--foreground)/0.25)]">
          {filteredOptions.length > 0 ? (
            <div className="space-y-1">
              {filteredOptions.map((option) => {
                const currentValue = optionValue(option);
                const selected = normalizeSearchText(currentValue) === normalizeSearchText(value);
                return (
                  <button
                    key={currentValue}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(option)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="min-w-0 truncate">{optionLabel(option)}</span>
                    {selected && <Check size={14} className="shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-2 py-2 text-xs text-muted-foreground">{labels.noResults}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterCombobox;
