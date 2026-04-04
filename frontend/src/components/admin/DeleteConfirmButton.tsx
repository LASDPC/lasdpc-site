import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmButtonProps {
  onConfirm: () => void;
  loading?: boolean;
}

const DeleteConfirmButton = ({ onConfirm, loading }: DeleteConfirmButtonProps) => (
  <Button
    type="button"
    variant="destructive"
    size="sm"
    onClick={() => {
      if (window.confirm("Are you sure you want to delete this item?")) {
        onConfirm();
      }
    }}
    disabled={loading}
  >
    <Trash2 size={14} className="mr-1" />
    Delete
  </Button>
);

export default DeleteConfirmButton;
