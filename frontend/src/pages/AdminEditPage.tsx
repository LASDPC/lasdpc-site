import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { ArrowLeft, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeleteConfirmButton from "@/components/admin/DeleteConfirmButton";
import PasswordResetCard from "@/components/admin/PasswordResetCard";
import PageHeader from "@/components/PageHeader";

import BlogForm from "@/components/admin/forms/BlogForm";
import ProjectForm from "@/components/admin/forms/ProjectForm";
import PublicationForm from "@/components/admin/forms/PublicationForm";
import PersonForm from "@/components/admin/forms/PersonForm";
import DocForm from "@/components/admin/forms/DocForm";
import InfraClusterForm from "@/components/admin/forms/InfraClusterForm";

import { useBlogPost, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost } from "@/hooks/useBlog";
import { useProject, useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { usePublication, useCreatePublication, useUpdatePublication, useDeletePublication } from "@/hooks/usePublications";
import { useUser, useCreateDocente, useUpdateDocente, useDeleteDocente, useCreateStudent, useUpdateStudent, useDeleteStudent } from "@/hooks/usePeople";
import { useCluster, useCreateCluster, useUpdateCluster, useDeleteCluster } from "@/hooks/useInfrastructure";
import { useDoc, useCreateDoc, useUpdateDoc, useDeleteDoc } from "@/hooks/useDocs";
import type { User } from "@/services/auth";

type ResourceType = "blog" | "project" | "publication" | "docente" | "student" | "cluster" | "doc";

const RESOURCE_LABELS: Record<ResourceType, { en: string; pt: string }> = {
  blog: { en: "Blog Post", pt: "Post do Blog" },
  project: { en: "Project", pt: "Projeto" },
  publication: { en: "Publication", pt: "Publicação" },
  docente: { en: "Faculty Member", pt: "Docente" },
  student: { en: "Student", pt: "Aluno" },
  cluster: { en: "Cluster", pt: "Cluster" },
  doc: { en: "Document", pt: "Documento" },
};

const AdminEditPage = () => {
  const { resource, id } = useParams<{ resource: string; id?: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { lang: globalLang } = useLang();
  const lang: "en" | "pt" = globalLang === "pt-BR" ? "pt" : "en";

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const res = resource as ResourceType;
  const isEdit = !!id;
  const isPerson = res === "docente" || res === "student";
  const labels = RESOURCE_LABELS[res] || { en: res, pt: res };
  const label = lang === "pt" ? labels.pt : labels.en;
  const title = lang === "pt"
    ? `${isEdit ? "Editar" : "Novo(a)"} ${label}`
    : `${isEdit ? "Edit" : "New"} ${label}`;

  const handleSuccess = () => {
    toast.success(lang === "pt"
      ? (isEdit ? "Atualizado com sucesso" : "Criado com sucesso")
      : (isEdit ? "Updated successfully" : "Created successfully"));
    if (isPerson) navigate("/admin");
    else navigate(-1);
  };

  return (
    <div className={isPerson ? "pb-16" : "py-12 md:py-16"}>
      {isPerson ? (
        <PageHeader
          icon={UserRound}
          eyebrow={lang === "pt" ? "Painel administrativo / Pessoas" : "Admin dashboard / People"}
          title={title}
          subtitle={lang === "pt" ? "Organize os dados do perfil e o acesso à conta em etapas claras." : "Manage profile details and account access in clear sections."}
        >
          <Button variant="outline" onClick={() => navigate("/admin")}><ArrowLeft size={16} />{lang === "pt" ? "Voltar ao painel" : "Back to dashboard"}</Button>
        </PageHeader>
      ) : null}
      <div className={isPerson ? "container mx-auto max-w-6xl px-4 pt-8 sm:px-6" : "mx-auto max-w-5xl px-4 sm:px-6"}>
        {!isPerson && (
          <div className="mb-8 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">{title}</h1>
          </div>
        )}

        <ResourceForm resource={res} id={id} lang={lang} onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

interface ResourceFormProps {
  resource: ResourceType;
  id?: string;
  lang: "en" | "pt";
  onSuccess: () => void;
}

const ResourceForm = ({ resource, id, lang, onSuccess }: ResourceFormProps) => {
  const navigate = useNavigate();
  const isEdit = !!id;

  switch (resource) {
    case "blog":
      return <BlogResourceForm id={id} lang={lang} isEdit={isEdit} onSuccess={onSuccess} onDelete={() => navigate(-1)} />;
    case "project":
      return <ProjectResourceForm id={id} lang={lang} isEdit={isEdit} onSuccess={onSuccess} onDelete={() => navigate(-1)} />;
    case "publication":
      return <PublicationResourceForm id={id} lang={lang} isEdit={isEdit} onSuccess={onSuccess} onDelete={() => navigate(-1)} />;
    case "docente":
      return <DocenteResourceForm id={id} lang={lang} isEdit={isEdit} onSuccess={onSuccess} onDelete={() => navigate("/admin")} />;
    case "student":
      return <StudentResourceForm id={id} lang={lang} isEdit={isEdit} onSuccess={onSuccess} onDelete={() => navigate("/admin")} />;
    case "cluster":
      return <ClusterResourceForm id={id} lang={lang} isEdit={isEdit} onSuccess={onSuccess} onDelete={() => navigate(-1)} />;
    case "doc":
      return <DocResourceForm id={id} lang={lang} isEdit={isEdit} onSuccess={onSuccess} onDelete={() => navigate(-1)} />;
    default:
      return <p className="text-destructive">Unknown resource type: {resource}</p>;
  }
};

interface FormWrapperProps {
  id?: string;
  lang: "en" | "pt";
  isEdit: boolean;
  onSuccess: () => void;
  onDelete: () => void;
}

const BlogResourceForm = ({ id, lang, isEdit, onSuccess, onDelete }: FormWrapperProps) => {
  const { data, isLoading } = useBlogPost(id || "");
  const create = useCreateBlogPost();
  const update = useUpdateBlogPost();
  const del = useDeleteBlogPost();

  if (isEdit && isLoading) return <FormSkeleton />;

  return (
    <>
      <BlogForm
        initial={isEdit ? data : undefined}
        lang={lang}
        loading={create.isPending || update.isPending}
        onSubmit={(values) => {
          if (isEdit && id) update.mutate({ id, data: values }, { onSuccess });
          else create.mutate(values, { onSuccess });
        }}
      />
      {isEdit && (
        <div className="flex justify-end pt-4 mt-4 border-t border-border">
          <DeleteConfirmButton
            loading={del.isPending}
            onConfirm={() => del.mutate(id!, { onSuccess: () => { toast.success("Deleted successfully"); onDelete(); } })}
          />
        </div>
      )}
    </>
  );
};

const ProjectResourceForm = ({ id, lang, isEdit, onSuccess, onDelete }: FormWrapperProps) => {
  const { data, isLoading } = useProject(id || "");
  const create = useCreateProject();
  const update = useUpdateProject();
  const del = useDeleteProject();

  if (isEdit && isLoading) return <FormSkeleton />;

  return (
    <>
      <ProjectForm
        initial={isEdit ? data : undefined}
        lang={lang}
        loading={create.isPending || update.isPending}
        onSubmit={(values) => {
          if (isEdit && id) update.mutate({ id, data: values }, { onSuccess });
          else create.mutate(values, { onSuccess });
        }}
      />
      {isEdit && (
        <div className="flex justify-end pt-4 mt-4 border-t border-border">
          <DeleteConfirmButton
            loading={del.isPending}
            onConfirm={() => del.mutate(id!, { onSuccess: () => { toast.success("Deleted successfully"); onDelete(); } })}
          />
        </div>
      )}
    </>
  );
};

const PublicationResourceForm = ({ id, lang, isEdit, onSuccess, onDelete }: FormWrapperProps) => {
  const { data, isLoading } = usePublication(id || "");
  const create = useCreatePublication();
  const update = useUpdatePublication();
  const del = useDeletePublication();

  if (isEdit && isLoading) return <FormSkeleton />;

  return (
    <>
      <PublicationForm
        initial={isEdit ? data : undefined}
        lang={lang}
        loading={create.isPending || update.isPending}
        onSubmit={(values) => {
          if (isEdit && id) update.mutate({ id, data: values }, { onSuccess });
          else create.mutate(values, { onSuccess });
        }}
      />
      {isEdit && (
        <div className="flex justify-end pt-4 mt-4 border-t border-border">
          <DeleteConfirmButton
            loading={del.isPending}
            onConfirm={() => del.mutate(id!, { onSuccess: () => { toast.success("Deleted successfully"); onDelete(); } })}
          />
        </div>
      )}
    </>
  );
};

function AccountActions({
  user, currentUserId, lang, deleting, onDelete,
}: {
  user: User;
  currentUserId?: string;
  lang: "en" | "pt";
  deleting: boolean;
  onDelete: () => void;
}) {
  const isPt = lang === "pt";
  const isOwnAccount = user.id === currentUserId;
  return (
    <div className="mt-6 space-y-6 lg:ml-[264px]">
      {isOwnAccount ? (
        <section id="account-access" className="surface-panel scroll-mt-28 rounded-2xl p-5 text-sm text-muted-foreground sm:p-7">
          {isPt ? "Outro administrador pode alterar a senha desta conta. Você não pode alterá-la por esta ação." : "Another administrator can change this account's password. You cannot use this action on your own account."}
        </section>
      ) : <PasswordResetCard user={user} isPt={isPt} />}
      {!isOwnAccount && !user.is_bootstrap_admin && (
        <section className="surface-panel rounded-2xl border border-destructive/20 p-5 sm:p-7">
          <h2 className="font-display text-lg font-semibold text-foreground">{isPt ? "Excluir conta" : "Delete account"}</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">{isPt ? "Remova esta conta somente quando ela não for mais necessária." : "Remove this account only when it is no longer needed."}</p>
          <DeleteConfirmButton loading={deleting} onConfirm={onDelete} isPt={isPt} />
        </section>
      )}
    </div>
  );
}

const DocenteResourceForm = ({ id, lang, isEdit, onSuccess, onDelete }: FormWrapperProps) => {
  const { user: currentUser } = useAuth();
  const { data, isLoading } = useUser(id || "");
  const create = useCreateDocente();
  const update = useUpdateDocente();
  const del = useDeleteDocente();

  if (isEdit && isLoading) return <FormSkeleton />;
  if (isEdit && !data) return <p role="alert" className="text-sm text-destructive">{lang === "pt" ? "Não foi possível carregar este perfil." : "Could not load this profile."}</p>;

  return (
    <>
      <PersonForm
        type="docente"
        initial={isEdit ? data : undefined}
        lang={lang}
        loading={create.isPending || update.isPending}
        onSubmit={(values: Record<string, unknown>) => {
          const onError = (error: Error) => toast.error(error.message || (lang === "pt" ? "Não foi possível salvar o perfil." : "Could not save the profile."));
          if (isEdit && id) update.mutate({ id, data: values }, { onSuccess, onError });
          else create.mutate(values as never, { onSuccess, onError });
        }}
      />
      {isEdit && data && <AccountActions user={data} currentUserId={currentUser?.id} lang={lang} deleting={del.isPending} onDelete={() => del.mutate(id!, { onSuccess: () => { toast.success(lang === "pt" ? "Conta excluída." : "Account deleted."); onDelete(); }, onError: (error) => toast.error(error.message) })} />}
    </>
  );
};

const StudentResourceForm = ({ id, lang, isEdit, onSuccess, onDelete }: FormWrapperProps) => {
  const { user: currentUser } = useAuth();
  const { data, isLoading } = useUser(id || "");
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const del = useDeleteStudent();

  if (isEdit && isLoading) return <FormSkeleton />;
  if (isEdit && !data) return <p role="alert" className="text-sm text-destructive">{lang === "pt" ? "Não foi possível carregar este perfil." : "Could not load this profile."}</p>;

  return (
    <>
      <PersonForm
        type="student"
        initial={isEdit ? data : undefined}
        lang={lang}
        loading={create.isPending || update.isPending}
        onSubmit={(values: Record<string, unknown>) => {
          const onError = (error: Error) => toast.error(error.message || (lang === "pt" ? "Não foi possível salvar o perfil." : "Could not save the profile."));
          if (isEdit && id) update.mutate({ id, data: values }, { onSuccess, onError });
          else create.mutate(values as never, { onSuccess, onError });
        }}
      />
      {isEdit && data && <AccountActions user={data} currentUserId={currentUser?.id} lang={lang} deleting={del.isPending} onDelete={() => del.mutate(id!, { onSuccess: () => { toast.success(lang === "pt" ? "Conta excluída." : "Account deleted."); onDelete(); }, onError: (error) => toast.error(error.message) })} />}
    </>
  );
};

const ClusterResourceForm = ({ id, lang, isEdit, onSuccess, onDelete }: FormWrapperProps) => {
  const { data, isLoading } = useCluster(id || "");
  const create = useCreateCluster();
  const update = useUpdateCluster();
  const del = useDeleteCluster();

  if (isEdit && isLoading) return <FormSkeleton />;

  return (
    <>
      <InfraClusterForm
        initial={isEdit ? data : undefined}
        lang={lang}
        loading={create.isPending || update.isPending}
        onSubmit={(values) => {
          if (isEdit && id) update.mutate({ id, data: values }, { onSuccess });
          else create.mutate(values, { onSuccess });
        }}
      />
      {isEdit && (
        <div className="flex justify-end pt-4 mt-4 border-t border-border">
          <DeleteConfirmButton
            loading={del.isPending}
            onConfirm={() => del.mutate(id!, { onSuccess: () => { toast.success("Deleted successfully"); onDelete(); } })}
          />
        </div>
      )}
    </>
  );
};

const DocResourceForm = ({ id, lang, isEdit, onSuccess, onDelete }: FormWrapperProps) => {
  const { data, isLoading } = useDoc(id || "");
  const create = useCreateDoc();
  const update = useUpdateDoc();
  const del = useDeleteDoc();

  if (isEdit && isLoading) return <FormSkeleton />;

  return (
    <>
      <DocForm
        initial={isEdit ? data : undefined}
        lang={lang}
        loading={create.isPending || update.isPending}
        onSubmit={(values) => {
          if (isEdit && id) update.mutate({ id, data: values }, { onSuccess });
          else create.mutate(values, { onSuccess });
        }}
      />
      {isEdit && (
        <div className="flex justify-end pt-4 mt-4 border-t border-border">
          <DeleteConfirmButton
            loading={del.isPending}
            onConfirm={() => del.mutate(id!, { onSuccess: () => { toast.success("Deleted successfully"); onDelete(); } })}
          />
        </div>
      )}
    </>
  );
};

const FormSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-10 bg-muted rounded-md" />
    <div className="h-10 bg-muted rounded-md" />
    <div className="h-32 bg-muted rounded-md" />
    <div className="h-10 bg-muted rounded-md" />
  </div>
);

export default AdminEditPage;
