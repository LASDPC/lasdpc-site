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
      {/* Soft blue glow that fades out *long before* the bottom of the
          header so the transition into the page background reads as a
          natural blend rather than a banner edge. Using an arbitrary
          linear-gradient so we can place the transparent stop early and
          leave the lower portion fully invisible. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--primary)/0.10)_0%,hsl(var(--primary)/0.05)_30%,hsl(var(--primary)/0.02)_60%,transparent_92%)]"
      />
      {/* Subtle blurred orb anchored near the top — kept far above the
          header bottom so it can't create a visible color seam. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-32 w-[440px] h-[440px] rounded-full bg-primary/[0.08] blur-3xl"
      />

      <div className="container mx-auto px-4 pt-10 pb-16 md:pt-12 md:pb-20 relative">
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
