import { Pencil } from "lucide-react";

interface PencilButtonProps {
  onClick: () => void;
}

const PencilButton = ({ onClick }: PencilButtonProps) => (
  <button
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground p-1.5 rounded-md hover:bg-primary/90 shadow-sm"
    aria-label="Edit"
  >
    <Pencil size={14} />
  </button>
);

export default PencilButton;
