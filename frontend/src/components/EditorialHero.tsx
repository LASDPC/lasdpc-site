import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight } from "lucide-react";

interface EditorialHeroProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
  action: string;
  target: string;
  visual: ReactNode;
  footer?: ReactNode;
}

export default function EditorialHero({ eyebrow, title, description, action, target, visual, footer }: EditorialHeroProps) {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden border-b border-border/70 bg-[radial-gradient(ellipse_at_88%_12%,hsl(var(--primary)/0.11),transparent_48%)]">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(hsl(var(--primary)/0.075)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.075)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:linear-gradient(to_right,transparent,black)]" />
      <div className="container relative mx-auto grid min-h-[560px] items-center gap-10 px-4 pb-14 pt-28 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-16 lg:pb-20 lg:pt-36">
        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: "easeOut" }} className="relative z-10">
          <p className="mb-5 font-mono text-xs font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
          <h1 className="max-w-[800px] font-display text-[clamp(3.2rem,7vw,7rem)] font-bold leading-[.98] tracking-[-.065em] text-foreground">{title}</h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{description}</p>
          <a href={target} className="group mt-8 inline-flex items-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            {action}<ArrowDownRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
          </a>
        </motion.div>
        <motion.div initial={reducedMotion ? false : { opacity: 0, scale: 0.94, x: 24 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.12, ease: "easeOut" }} className="relative min-h-[300px] lg:min-h-[400px]">
          {visual}
        </motion.div>
        {footer && <div className="relative z-10 col-span-full border-t border-border/70 pt-5">{footer}</div>}
      </div>
    </section>
  );
}
