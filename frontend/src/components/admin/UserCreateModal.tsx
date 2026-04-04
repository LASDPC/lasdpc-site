import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth";
import { toast } from "sonner";
import { useState } from "react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["admin", "normal"]),
  initials: z.string().min(1).max(3),
});

type FormValues = z.infer<typeof schema>;

interface UserCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const UserCreateModal = ({ open, onClose }: UserCreateModalProps) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "normal" },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await authService.createUser(values);
      toast.success("User created successfully");
      reset();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>Add a new user to the system.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><Label>Email</Label><Input {...register("email")} type="email" />{errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}</div>
          <div><Label>Password</Label><Input {...register("password")} type="password" />{errors.password && <p className="text-xs text-destructive mt-1">Min 6 characters</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Name</Label><Input {...register("name")} /></div>
            <div><Label>Initials</Label><Input {...register("initials")} maxLength={3} placeholder="JS" /></div>
          </div>
          <div><Label>Role</Label><select {...register("role")} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"><option value="normal">Normal</option><option value="admin">Admin</option></select></div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : "Create User"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserCreateModal;
