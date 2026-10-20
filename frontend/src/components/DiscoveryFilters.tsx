import { Children, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

interface DiscoveryFiltersProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  count: number;
  countLabel: string;
  hint: string;
  clearLabel: string;
  filtersLabel: string;
  active: boolean;
  onClear: () => void;
  children: ReactNode;
}

export default function DiscoveryFilters({ icon: Icon, eyebrow, title, count, countLabel, hint, clearLabel, filtersLabel, active, onClear, children }: DiscoveryFiltersProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const controls = Children.toArray(children);
  const [searchControl, ...secondaryControls] = controls;

  return (
    <section aria-label={title} className="sticky top-[5.25rem] z-40 mb-10 overflow-visible rounded-2xl border border-border/90 bg-card/95 p-3 shadow-[0_18px_45px_-28px_hsl(var(--foreground)/0.35)] backdrop-blur-xl md:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={19} strokeWidth={1.7} /></div>
          <div className="min-w-0"><p className="hidden font-mono text-[10px] font-bold uppercase tracking-[.18em] text-accent lg:block">{eyebrow}</p><h2 className="truncate font-display text-base font-bold tracking-tight text-foreground md:text-lg">{title}</h2></div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {active && <button type="button" onClick={onClear} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X size={13} /><span className="hidden sm:inline">{clearLabel}</span></button>}
          <div aria-live="polite" className="inline-flex items-baseline gap-1.5 rounded-full border border-border bg-background/75 px-3 py-1.5 text-muted-foreground"><strong className="font-display text-base leading-none text-foreground">{count}</strong><span className="hidden text-[11px] font-medium sm:inline">{countLabel}</span></div>
        </div>
      </div>
      <div className="flex items-stretch gap-2 [&>*:first-child]:min-w-0 [&>*:first-child]:flex-1 [&_input]:h-11 [&_input]:rounded-xl [&_input]:border-border [&_input]:bg-background/80 [&_input]:shadow-none [&_input:focus-visible]:border-primary [&_input:focus-visible]:ring-2 [&_input:focus-visible]:ring-primary/15">
        {searchControl}
        {secondaryControls.length > 0 && (
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((open) => !open)}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background/80 px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-secondary md:hidden"
            aria-expanded={mobileFiltersOpen}
            aria-controls="discovery-secondary-filters"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">{filtersLabel}</span>
            <ChevronDown size={14} className={`transition-transform ${mobileFiltersOpen ? "rotate-180" : ""}`} />
          </button>
        )}
        <div className="hidden min-w-0 flex-[2] items-stretch gap-2 md:flex">
          {secondaryControls}
        </div>
      </div>
      {secondaryControls.length > 0 && mobileFiltersOpen && (
        <div id="discovery-secondary-filters" className="mt-2 grid gap-2 border-t border-border/70 pt-2 md:hidden [&>*]:min-w-0 [&>*]:w-full [&_input]:h-11 [&_select]:h-11">
          {secondaryControls}
        </div>
      )}
      <p className="sr-only">{hint}</p>
    </section>
  );
}
