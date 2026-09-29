import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

type VantaEffect = {
  destroy: () => void;
};

type VantaNetEffect = VantaEffect & {
  linesMesh?: {
    material?: {
      opacity: number;
    };
  };
};

type VantaGlobeBackgroundProps = {
  variant?: "hero" | "section";
};

/**
 * Ambient WebGL layer anchored to the top of the document. Vanta is loaded
 * lazily so it never delays the initial React render, and the CSS background
 * remains as a fallback when WebGL is unavailable or motion is reduced.
 */
const VantaGlobeBackground = ({ variant = "hero" }: VantaGlobeBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const target = containerRef.current;
    if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let effect: VantaEffect | undefined;
    let observer: IntersectionObserver | undefined;
    let cancelled = false;
    let shouldRun = variant === "hero";
    let loading = false;

    const start = async () => {
      shouldRun = true;
      if (effect || loading) return;
      loading = true;

      try {
        const vantaModulePromise = variant === "section"
          ? import("vanta/dist/vanta.net.min")
          : import("vanta/dist/vanta.globe.min");
        const [vantaModule, THREE] = await Promise.all([
          vantaModulePromise,
          import("three"),
        ]);

        if (cancelled || !shouldRun || !containerRef.current) return;

        const isHighContrast = theme === "high-contrast";
        const isDark = theme === "dark" || isHighContrast;

        const VANTA = vantaModule.default;
        const sharedOptions = {
          el: containerRef.current,
          THREE,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1,
          backgroundColor: 0x0c1422,
          backgroundAlpha: 0,
        };

        if (variant === "section") {
          const netEffect = VANTA({
              ...sharedOptions,
              scaleMobile: 0.78,
              color: isHighContrast ? 0xffe600 : isDark ? 0x27c69f : 0x1454b8,
              points: 9,
              maxDistance: 22,
              spacing: 17,
              showDots: true,
            }) as VantaNetEffect;

          if (netEffect.linesMesh?.material) {
            netEffect.linesMesh.material.opacity = isHighContrast ? 0.5 : isDark ? 0.28 : 1;
          }
          effect = netEffect;
        } else {
          effect = VANTA({
              ...sharedOptions,
              scaleMobile: 0.72,
              color: isHighContrast ? 0xffe600 : isDark ? 0x4d8dff : 0x1454b8,
              color2: isHighContrast ? 0xffffff : isDark ? 0x27c69f : 0x00a77b,
              size: 1.08,
            }) as VantaEffect;
        }
      } catch {
        // The CSS fallback intentionally remains visible.
      } finally {
        loading = false;
      }
    };

    const stop = () => {
      shouldRun = false;
      effect?.destroy();
      effect = undefined;
    };

    if (variant === "section") {
      observer = new IntersectionObserver(
        ([entry]) => entry.isIntersecting ? void start() : stop(),
        { rootMargin: "240px 0px" },
      );
      observer.observe(target);
    } else {
      void start();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      stop();
    };
  }, [theme, variant]);

  if (variant === "section") {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div ref={containerRef} className="cta-vanta-fade vanta-light-tint absolute inset-0 mix-blend-multiply opacity-80 dark:mix-blend-normal dark:opacity-80" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--background)/0.78),transparent_24%,transparent_72%,hsl(var(--background)/0.86))]" />
        <div className="tech-grid absolute inset-0 opacity-20 dark:opacity-15" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[100svh] min-h-[680px] overflow-hidden" aria-hidden="true">
      <div ref={containerRef} className="vanta-light-tint absolute inset-0 mix-blend-multiply opacity-80 dark:mix-blend-normal dark:opacity-70" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,hsl(var(--background)/0.08)_45%,hsl(var(--background)/0.88)_88%,hsl(var(--background))_100%)]" />
      <div className="tech-grid absolute inset-0 opacity-50 dark:opacity-30" />
    </div>
  );
};

export default VantaGlobeBackground;
