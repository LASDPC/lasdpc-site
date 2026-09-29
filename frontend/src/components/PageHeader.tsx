import type { ComponentType, ReactNode } from "react";

interface PageHeaderProps {
  /** Icon component (typically a lucide-react icon) rendered next to the title. */
  icon: ComponentType<{ className?: string; size?: number }>;
  /** Main heading text. */
  title: string;
  /** Optional subtitle / lede paragraph rendered under the title. */
  subtitle?: ReactNode;
  /** Optional eyebrow text rendered above the title. */
  eyebrow?: string;
  /** Extra content rendered after the subtitle (e.g. CTA buttons). */
  children?: ReactNode;
  /** Extra classes appended to the outer wrapper. */
  className?: string;
  /** Optional `data-testid` for the heading element. */
  titleTestId?: string;
}

const PageHeader = ({
  icon: Icon,
  title,
  subtitle,
  eyebrow,
  children,
  className = "",
  titleTestId,
}: PageHeaderProps) => {
  return (
    <div className={`relative overflow-hidden border-b border-border/70 bg-[radial-gradient(ellipse_at_85%_15%,hsl(var(--primary)/0.13),transparent_48%)] ${className}`}>
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="container relative mx-auto px-4 pb-14 pt-14 md:pb-20 md:pt-20">
        {eyebrow && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border/80 bg-card/90 text-primary shadow-sm backdrop-blur md:h-14 md:w-14 dark:bg-card/80">
            <Icon className="h-6 w-6 md:h-7 md:w-7" />
          </span>
          <h1
            data-testid={titleTestId}
            className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.055em] text-foreground sm:text-5xl md:text-6xl"
          >
            {title}
          </h1>
        </div>
        {subtitle && (
          <div className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </div>
        )}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
