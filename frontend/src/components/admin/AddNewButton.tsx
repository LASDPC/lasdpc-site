import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddNewButtonProps {
  label: string;
  onClick: () => void;
}

const AddNewButton = ({ label, onClick }: AddNewButtonProps) => (
  <Button onClick={onClick} size="sm" className="gap-1.5">
    <Plus size={16} />
    {label}
  </Button>
);

export default AddNewButton;
