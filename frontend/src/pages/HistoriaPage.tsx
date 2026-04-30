import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Landmark } from "lucide-react";

import { useLang } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import lasdpcLogo from "@/assets/lasdpc-logo.png";

type HistoryEventKey = "1990" | "gsdpc" | "evolution" | "training" | "today";

const EVENT_KEYS: HistoryEventKey[] = ["1990", "gsdpc", "evolution", "training", "today"];

export default function HistoriaPage() {
  const { t } = useLang();
  const [openIds, setOpenIds] = useState<Set<HistoryEventKey>>(() => new Set());

  const items = useMemo(
    () =>
      EVENT_KEYS.map((id) => ({
        id,
        year:
          id === "1990"
            ? "1990"
            : id === "gsdpc"
              ? "1990"
              : id === "evolution"
                ? "1990-2000"
              : id === "training"
                ? (t("history.todayLabel") || "Hoje")
                : id === "today"
                  ? (t("history.todayLabel") || "Hoje")
                  : "",
        title: t(`history.events.${id}.title`),
        summary: t(`history.events.${id}.summary`),
        paragraphs: [
          t(`history.events.${id}.p1`),
          t(`history.events.${id}.p2`),
          t(`history.events.${id}.p3`),
        ].filter((p) => p && !p.startsWith("history.events.")),
        imageCaption: t(`history.events.${id}.imageCaption`),
      })),
    [t]
  );

  const toggle = (id: HistoryEventKey) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 mt-16">
      <div className="flex items-center gap-3 mb-2">
        <Landmark className="h-8 w-8 text-primary" />
        <h1 className="font-display text-4xl font-bold text-foreground" data-testid="history-title">
          {t("history.title")}
        </h1>
      </div>
      <p className="text-muted-foreground max-w-2xl mb-10" data-testid="history-subtitle">
        {t("history.subtitle")}
      </p>

      <div className="relative">
        {/* Center line */}
        <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-primary/20" />

        <div className="space-y-12">
          {items.map((it, i) => {
            const isLeft = i % 2 === 0;
            const isOpen = openIds.has(it.id);
            return (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative flex items-start md:items-center"
                data-testid={`history-item-${it.id}`}
              >
                {/* Dot */}
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background z-10" />

                {/* Content card - mobile always right, desktop alternates */}
                <div
                  className={cn(
                    // Keep cards from crossing the center line (so the dot never overlaps),
                    // but make them feel wider by reducing wasted whitespace inside the half.
                    "ml-12 md:ml-0 md:w-1/2",
                    // Nudge each half outward so cards sit closer to the page edges (wider outward, not inward).
                    isLeft ? "md:pr-16 md:-ml-6" : "md:pl-16 md:ml-auto md:-mr-6"
                  )}
                >
                  <motion.div
                    layout
                    className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-mono text-sm text-accent font-semibold">
                          {it.year || (it.id === "today" ? "Hoje" : "")}
                        </span>
                        <h3 className="font-display text-lg font-bold text-foreground mt-1 truncate">
                          {it.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-2">
                          {it.summary}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggle(it.id)}
                        className="shrink-0"
                        data-testid={`history-toggle-${it.id}`}
                      >
                        {isOpen ? t("history.collapse") : t("history.expand")}
                        {isOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                      </Button>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          key="expanded"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="overflow-hidden"
                          data-testid={`history-expanded-${it.id}`}
                        >
                          <div className="mt-4 space-y-3">
                            {it.paragraphs.map((p, idx) => (
                              <p key={idx} className="text-sm text-foreground leading-relaxed">
                                {p}
                              </p>
                            ))}

                            <div className="mt-4 rounded-lg overflow-hidden border border-border">
                              <img src={lasdpcLogo} alt="LaSDPC" className="w-full h-44 object-cover bg-background" />
                              <div className="px-3 py-2 text-xs text-muted-foreground bg-secondary/40">
                                {it.imageCaption}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
