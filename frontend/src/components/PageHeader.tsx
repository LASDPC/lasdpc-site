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

/**
 * Page-level header band shared across the site. Renders the section icon +
 * title (and optional subtitle / eyebrow / actions) over a soft blue gradient
 * background, so every section page opens with the same visual rhythm.
 */
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
    <div className={`relative overflow-hidden ${className}`}>
      {/* Vertical gradient that fades into the page background — no hard
          bottom border, so the transition reads as a soft glow rather than a
          banner. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/[0.04] to-transparent"
      />
      {/* Decorative blurred orbs (subtle) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-24 w-[360px] h-[360px] rounded-full bg-accent/[0.06] blur-3xl"
      />

      <div className="container mx-auto px-4 py-10 md:py-12 relative">
        {eyebrow && (
          <p className="text-primary font-mono text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Icon className="h-7 w-7 md:h-8 md:w-8 text-primary shrink-0" />
          <h1
            data-testid={titleTestId}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight"
          >
            {title}
          </h1>
        </div>
        {subtitle && (
          <div className="mt-3 text-muted-foreground text-sm sm:text-base max-w-2xl">
            {subtitle}
          </div>
        )}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
