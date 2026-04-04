import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, UserPlus, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";

const UserAvatarButton = () => {
  const { user, isAdmin, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  if (!user) {
    return (
      <button
        onClick={() => navigate("/login")}
        className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
        aria-label={t("auth.login")}
      >
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User size={16} />
          </AvatarFallback>
        </Avatar>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
          aria-label={user.name}
        >
          <Avatar className="h-8 w-8 cursor-pointer">
            {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {user.initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <Badge variant={isAdmin ? "default" : "secondary"} className="w-fit mt-1 text-[10px]">
              {isAdmin ? t("menu.role.admin") : t("menu.role.normal")}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isAdmin && (
          <>
            <DropdownMenuItem
              onClick={() => toast.info(t("menu.addUser") + " — feature em desenvolvimento")}
              className="text-primary font-semibold cursor-pointer"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t("menu.addUser")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={() => toast.info(t("menu.profile") + " — feature em desenvolvimento")}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          {t("menu.profile")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast.info(t("menu.settings") + " — feature em desenvolvimento")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          {t("menu.settings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("menu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatarButton;
