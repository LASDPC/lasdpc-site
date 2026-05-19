import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  labels: { prev: string; next: string; pageOf: string };
}

/**
 * Pagination strip mirroring the People page: prev / numbered pages with
 * collapsed ellipses around the current page / next, plus a "Page X of Y"
 * indicator. Renders nothing when there is only one page.
 */
const PaginationControls = ({ page, pageCount, onChange, labels }: PaginationControlsProps) => {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        <ChevronLeft size={16} className="mr-1" />
        {labels.prev}
      </Button>

      {Array.from({ length: pageCount }).map((_, idx) => {
        const p = idx + 1;
        const isEdge = p === 1 || p === pageCount;
        const isNear = Math.abs(p - page) <= 1;
        if (!isEdge && !isNear) {
          if (p === 2 || p === pageCount - 1) {
            return (
              <span
                key={`ellipsis-${p}`}
                className="text-muted-foreground px-2 select-none"
              >
                …
              </span>
            );
          }
          return null;
        }
        return (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(p)}
            className="min-w-[36px]"
          >
            {p}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
      >
        {labels.next}
        <ChevronRight size={16} className="ml-1" />
      </Button>

      <span className="text-xs font-mono text-muted-foreground ml-3">
        {labels.pageOf
          .replace("{current}", String(page))
          .replace("{total}", String(pageCount))}
      </span>
    </div>
  );
};

export default PaginationControls;
