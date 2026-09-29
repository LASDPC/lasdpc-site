import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { SlidersHorizontal, X } from "lucide-react";

interface DiscoveryFiltersProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  count: number;
  countLabel: string;
  hint: string;
  clearLabel: string;
  active: boolean;
  onClear: () => void;
  children: ReactNode;
}

export default function DiscoveryFilters({ icon: Icon, eyebrow, title, count, countLabel, hint, clearLabel, active, onClear, children }: DiscoveryFiltersProps) {
  return (
    <section aria-label={title} className="relative z-20 mb-14 overflow-visible rounded-[1.75rem] border border-border bg-card/80 p-5 shadow-[0_22px_60px_-48px_hsl(var(--primary)/0.55)] backdrop-blur-sm md:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon size={23} strokeWidth={1.6} /></div>
          <div><p className="font-mono text-[11px] font-bold uppercase tracking-[.2em] text-accent">{eyebrow}</p><h2 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">{title}</h2></div>
        </div>
        <div aria-live="polite" className="inline-flex items-baseline gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-muted-foreground"><strong className="font-display text-xl leading-none text-foreground">{count}</strong><span className="text-xs font-medium">{countLabel}</span></div>
      </div>
      <div className="flex flex-wrap items-stretch gap-3 [&_input]:h-12 [&_input]:rounded-xl [&_input]:border-border [&_input]:bg-background/75 [&_input]:shadow-none [&_input:focus-visible]:border-primary [&_input:focus-visible]:ring-2 [&_input:focus-visible]:ring-primary/15">
        {children}
      </div>
      <div className="mt-5 flex min-h-8 flex-wrap items-center justify-between gap-2 border-t border-border/75 pt-4">
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><SlidersHorizontal size={14} className="text-primary" />{hint}</p>
        {active && <button type="button" onClick={onClear} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X size={14} />{clearLabel}</button>}
      </div>
    </section>
  );
}
