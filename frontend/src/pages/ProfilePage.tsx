import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/hooks/usePeople";
import { peopleService } from "@/services/people";
import { getToken } from "@/lib/api";
import { Mail, ExternalLink, Camera, GraduationCap, BookOpen, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const ROLE_LABELS: Record<string, { en: string; pt: string }> = {
  docente: { en: "Faculty", pt: "Docente" },
  aluno_ativo: { en: "Active Student", pt: "Aluno Ativo" },
  alumni: { en: "Alumni", pt: "Egresso" },
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  docente: <BookOpen size={16} />,
  aluno_ativo: <GraduationCap size={16} />,
  alumni: <UserIcon size={16} />,
};

const ProfilePageSkeleton = () => (
  <div className="py-10">
    <div className="container mx-auto px-4 max-w-2xl">
      <div className="flex items-start gap-6">
        <Skeleton className="w-24 h-24 rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  </div>
);

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { lang } = useLang();
  const { user: currentUser } = useAuth();
  const isPt = lang === "pt-BR";
  const { data: profile, isLoading } = useUser(userId || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  if (isLoading) return <ProfilePageSkeleton />;
  if (!profile) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">{isPt ? "Usuário não encontrado" : "User not found"}</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const roleLabel = ROLE_LABELS[profile.role]?.[isPt ? "pt" : "en"] ?? profile.role;
  const roleIcon = ROLE_ICONS[profile.role];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error(isPt ? "Apenas JPG/PNG são permitidos" : "Only JPG/PNG images are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(isPt ? "Arquivo deve ter no máximo 2 MB" : "File must be under 2 MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = getToken();
      const res = await fetch("/api/v1/uploads", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();

      await peopleService.updateUser(profile.id, { photo: url });
      queryClient.invalidateQueries({ queryKey: ["user", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
      toast.success(isPt ? "Foto atualizada!" : "Photo updated!");
    } catch {
      toast.error(isPt ? "Erro ao fazer upload" : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="relative group shrink-0">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-3xl">
                {profile.initials}
              </div>
            )}
            {isOwnProfile && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera size={20} className="text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold text-foreground">{profile.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {roleIcon}
              <span>{roleLabel}</span>
              {profile.is_admin && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">Admin</span>
              )}
            </div>
            {(profile.title || profile.titlePt) && (
              <p className="text-sm text-foreground mt-2">{isPt ? profile.titlePt : profile.title}</p>
            )}
            {(profile.area || profile.areaPt) && (
              <p className="text-sm text-accent mt-1">{isPt ? profile.areaPt : profile.area}</p>
            )}
            {(profile.level || profile.levelPt) && (
              <p className="text-sm text-muted-foreground mt-1">
                {isPt ? profile.levelPt : profile.level}
              </p>
            )}
          </div>
        </div>

        {/* Contact & Links */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-foreground">
            {isPt ? "Contato e Links" : "Contact & Links"}
          </h2>
          <div className="space-y-3 text-sm">
            <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Mail size={16} />
              {profile.email}
            </a>
            {profile.lattes && (
              <a href={profile.lattes} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink size={16} />
                Lattes
              </a>
            )}
            {profile.orcid && (
              <a href={profile.orcid} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink size={16} />
                ORCID
              </a>
            )}
            {profile.scholar && (
              <a href={profile.scholar} target="_blank" rel="noopener" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink size={16} />
                Google Scholar
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
