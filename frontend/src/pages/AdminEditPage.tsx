import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeleteConfirmButton from "@/components/admin/DeleteConfirmButton";

import BlogForm from "@/components/admin/forms/BlogForm";
import ProjectForm from "@/components/admin/forms/ProjectForm";
import PublicationForm from "@/components/admin/forms/PublicationForm";
import PersonForm from "@/components/admin/forms/PersonForm";
import DocForm from "@/components/admin/forms/DocForm";
import InfraClusterForm from "@/components/admin/forms/InfraClusterForm";

import { useBlogPost, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost } from "@/hooks/useBlog";
import { useProject, useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { usePublication, useCreatePublication, useUpdatePublication, useDeletePublication } from "@/hooks/usePublications";
import { useDocente, useCreateDocente, useUpdateDocente, useDeleteDocente, useStudent, useCreateStudent, useUpdateStudent, useDeleteStudent } from "@/hooks/usePeople";
import { useCluster, useCreateCluster, useUpdateCluster, useDeleteCluster } from "@/hooks/useInfrastructure";
import { useDoc, useCreateDoc, useUpdateDoc, useDeleteDoc } from "@/hooks/useDocs";

type ResourceType = "blog" | "project" | "publication" | "docente" | "student" | "cluster" | "doc";

const RESOURCE_LABELS: Record<ResourceType, string> = {
  blog: "Blog",
  project: "Project",
  publication: "Publication",
  docente: "Docente",
  student: "Student",
  cluster: "Cluster",
  doc: "Doc",
};

const AdminEditPage = () => {
  const { resource, id } = useParams<{ resource: string; id?: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [lang, setLang] = useState<"en" | "pt">("en");

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const res = resource as ResourceType;
  const isEdit = !!id;
  const label = RESOURCE_LABELS[res] || res;
  const title = `${isEdit ? "Edit" : "New"} ${label}`;

  const handleSuccess = () => {
    toast.success(isEdit ? "Updated successfully" : "Created successfully");
    navigate(-1);
  };

  return (
    <div className="py-4">
      <div className="mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  lang === "en"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("pt")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  lang === "pt"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                PT
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
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
      return <DocenteResourceForm id={id} lang={lang} isEdit={isEdit} onSuccess={onSuccess} onDelete={() => navigate(-1)} />;
    case "student":
      return <StudentResourceForm id={id} lang={lang} isEdit={isEdit} onSuccess={onSuccess} onDelete={() => navigate(-1)} />;
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

const DocenteResourceForm = ({ id, lang, isEdit, onSuccess, onDelete }: FormWrapperProps) => {
  const { data, isLoading } = useDocente(id || "");
  const create = useCreateDocente();
  const update = useUpdateDocente();
  const del = useDeleteDocente();

  if (isEdit && isLoading) return <FormSkeleton />;

  return (
    <>
      <PersonForm
        type="docente"
        initial={isEdit ? data : undefined}
        lang={lang}
        loading={create.isPending || update.isPending}
        onSubmit={(values: Record<string, unknown>) => {
          if (isEdit && id) update.mutate({ id, data: values }, { onSuccess });
          else create.mutate(values as never, { onSuccess });
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

const StudentResourceForm = ({ id, lang, isEdit, onSuccess, onDelete }: FormWrapperProps) => {
  const { data, isLoading } = useStudent(id || "");
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const del = useDeleteStudent();

  if (isEdit && isLoading) return <FormSkeleton />;

  return (
    <>
      <PersonForm
        type="student"
        initial={isEdit ? data : undefined}
        lang={lang}
        loading={create.isPending || update.isPending}
        onSubmit={(values: Record<string, unknown>) => {
          if (isEdit && id) update.mutate({ id, data: values }, { onSuccess });
          else create.mutate(values as never, { onSuccess });
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
