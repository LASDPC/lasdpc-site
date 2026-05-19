import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchFilterBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearLabel: string;
  ariaLabel?: string;
  className?: string;
}

const SearchFilterBar = ({
  value,
  onChange,
  placeholder,
  clearLabel,
  ariaLabel,
  className,
}: SearchFilterBarProps) => (
  <div className={cn("mb-10 bg-card border border-border rounded-xl p-4", className)}>
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-label={ariaLabel ?? placeholder}
            className="pl-9 pr-9"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={14} />
              <span className="sr-only">{clearLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default SearchFilterBar;
