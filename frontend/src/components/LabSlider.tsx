import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LabSlide {
  /** Image URL — placeholders OK while real lab photos are not in yet. */
  src: string;
  /** Bilingual caption shown over the image. */
  title: string;
  titlePt?: string;
  description?: string;
  descriptionPt?: string;
}

interface LabSliderProps {
  slides: LabSlide[];
  /** Auto-advance interval in ms. Set to 0 to disable autoplay. */
  autoplayInterval?: number;
  isPt?: boolean;
  className?: string;
}

/**
 * Decorative full-width photo carousel for the home page. Uses Embla under
 * the hood with a hand-rolled autoplay (pauses on hover / focus) so we don't
 * need the extra `embla-carousel-autoplay` dependency.
 *
 * Each slide renders the image with a soft bottom gradient and an optional
 * caption block. Dot indicators + previous/next arrows are wired to Embla's
 * API for keyboard and mouse navigation.
 */
const LabSlider = ({
  slides,
  autoplayInterval = 5500,
  isPt = false,
  className,
}: LabSliderProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Hand-rolled autoplay — pause when the user hovers the slider, focuses
  // inside it, or hides the tab.
  useEffect(() => {
    if (!emblaApi || !autoplayInterval) return;
    if (isHovered) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      emblaApi.scrollNext();
    }, autoplayInterval);

    return () => window.clearInterval(id);
  }, [emblaApi, autoplayInterval, isHovered]);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (slides.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      aria-roledescription="carousel"
    >
      <div
        className="overflow-hidden rounded-2xl border border-border shadow-xl"
        ref={emblaRef}
      >
        <div className="flex">
          {slides.map((slide, i) => {
            const title = isPt && slide.titlePt ? slide.titlePt : slide.title;
            const description =
              isPt && slide.descriptionPt ? slide.descriptionPt : slide.description;
            return (
              <div
                key={i}
                className="relative shrink-0 grow-0 basis-full"
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${slides.length}`}
              >
                <div className="relative aspect-[16/9] w-full bg-muted">
                  <img
                    src={slide.src}
                    alt={title}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                    draggable={false}
                  />
                  {/* Bottom gradient for caption legibility */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
                  />
                  {(title || description) && (
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 md:p-10 text-white">
                      <p className="font-mono text-[10px] sm:text-xs uppercase tracking-widest opacity-80 mb-1 sm:mb-2">
                        {String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                      </p>
                      <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold leading-tight drop-shadow-md">
                        {title}
                      </h3>
                      {description && (
                        <p className="mt-2 text-sm sm:text-base text-white/85 max-w-2xl drop-shadow">
                          {description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prev / Next */}
      <button
        type="button"
        onClick={scrollPrev}
        aria-label={isPt ? "Slide anterior" : "Previous slide"}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-background/85 backdrop-blur border border-border text-foreground shadow-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-background"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        aria-label={isPt ? "Próximo slide" : "Next slide"}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-background/85 backdrop-blur border border-border text-foreground shadow-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-background"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-3 sm:bottom-4 flex items-center justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={
              isPt ? `Ir para o slide ${i + 1}` : `Go to slide ${i + 1}`
            }
            aria-current={i === selectedIndex}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === selectedIndex
                ? "w-8 bg-white"
                : "w-2.5 bg-white/55 hover:bg-white/80",
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default LabSlider;
