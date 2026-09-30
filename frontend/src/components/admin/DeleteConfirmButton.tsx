import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmButtonProps {
  onConfirm: () => void;
  loading?: boolean;
  isPt?: boolean;
}

const DeleteConfirmButton = ({ onConfirm, loading, isPt = false }: DeleteConfirmButtonProps) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button type="button" variant="destructive" size="sm" disabled={loading}>
        <Trash2 size={14} className="mr-1" />
        {isPt ? "Excluir" : "Delete"}
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{isPt ? "Confirmar exclusão" : "Confirm deletion"}</AlertDialogTitle>
        <AlertDialogDescription>
          {isPt ? "Esta ação exclui o item permanentemente. Deseja continuar?" : "This permanently deletes the item. Do you want to continue?"}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{isPt ? "Cancelar" : "Cancel"}</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          {isPt ? "Excluir" : "Delete"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default DeleteConfirmButton;
