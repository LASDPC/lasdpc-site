import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ProjectForm from "./forms/ProjectForm";
import PublicationForm from "./forms/PublicationForm";
import BlogForm from "./forms/BlogForm";
import PersonForm from "./forms/PersonForm";
import DocForm from "./forms/DocForm";
import InfraClusterForm from "./forms/InfraClusterForm";
import DeleteConfirmButton from "./DeleteConfirmButton";
import { toast } from "sonner";

import { useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { useCreatePublication, useUpdatePublication, useDeletePublication } from "@/hooks/usePublications";
import { useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost } from "@/hooks/useBlog";
import { useCreateDocente, useUpdateDocente, useDeleteDocente, useCreateStudent, useUpdateStudent, useDeleteStudent } from "@/hooks/usePeople";
import { useCreateCluster, useUpdateCluster, useDeleteCluster } from "@/hooks/useInfrastructure";
import { useCreateDoc, useUpdateDoc, useDeleteDoc } from "@/hooks/useDocs";

export type ResourceType = "project" | "publication" | "blog" | "docente" | "student" | "cluster" | "doc";

interface AdminEditModalProps {
  open: boolean;
  onClose: () => void;
  resource: ResourceType;
  data?: any;
}

const AdminEditModal = ({ open, onClose, resource, data }: AdminEditModalProps) => {
  const isEdit = !!data;
  const title = `${isEdit ? "Edit" : "New"} ${resource.charAt(0).toUpperCase() + resource.slice(1)}`;

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createPublication = useCreatePublication();
  const updatePublication = useUpdatePublication();
  const deletePublication = useDeletePublication();
  const createBlogPost = useCreateBlogPost();
  const updateBlogPost = useUpdateBlogPost();
  const deleteBlogPost = useDeleteBlogPost();
  const createDocente = useCreateDocente();
  const updateDocente = useUpdateDocente();
  const deleteDocente = useDeleteDocente();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const createCluster = useCreateCluster();
  const updateCluster = useUpdateCluster();
  const deleteCluster = useDeleteCluster();
  const createDoc = useCreateDoc();
  const updateDoc = useUpdateDoc();
  const deleteDoc = useDeleteDoc();

  const handleSuccess = () => {
    toast.success(isEdit ? "Updated successfully" : "Created successfully");
    onClose();
  };

  const handleDelete = () => {
    if (!data?.id) return;
    const mutations: Record<ResourceType, any> = {
      project: deleteProject,
      publication: deletePublication,
      blog: deleteBlogPost,
      docente: deleteDocente,
      student: deleteStudent,
      cluster: deleteCluster,
      doc: deleteDoc,
    };
    mutations[resource].mutate(data.id, {
      onSuccess: () => { toast.success("Deleted successfully"); onClose(); },
    });
  };

  const renderForm = () => {
    switch (resource) {
      case "project":
        return (
          <ProjectForm
            initial={data}
            loading={createProject.isPending || updateProject.isPending}
            onSubmit={(values) => {
              if (isEdit) updateProject.mutate({ id: data.id, data: values }, { onSuccess: handleSuccess });
              else createProject.mutate(values, { onSuccess: handleSuccess });
            }}
          />
        );
      case "publication":
        return (
          <PublicationForm
            initial={data}
            loading={createPublication.isPending || updatePublication.isPending}
            onSubmit={(values) => {
              if (isEdit) updatePublication.mutate({ id: data.id, data: values }, { onSuccess: handleSuccess });
              else createPublication.mutate(values, { onSuccess: handleSuccess });
            }}
          />
        );
      case "blog":
        return (
          <BlogForm
            initial={data}
            loading={createBlogPost.isPending || updateBlogPost.isPending}
            onSubmit={(values) => {
              if (isEdit) updateBlogPost.mutate({ id: data.id, data: values }, { onSuccess: handleSuccess });
              else createBlogPost.mutate(values, { onSuccess: handleSuccess });
            }}
          />
        );
      case "docente":
        return (
          <PersonForm
            type="docente"
            initial={data}
            loading={createDocente.isPending || updateDocente.isPending}
            onSubmit={(values: Record<string, unknown>) => {
              if (isEdit) updateDocente.mutate({ id: data.id, data: values }, { onSuccess: handleSuccess });
              else createDocente.mutate(values as never, { onSuccess: handleSuccess });
            }}
          />
        );
      case "student":
        return (
          <PersonForm
            type="student"
            initial={data}
            loading={createStudent.isPending || updateStudent.isPending}
            onSubmit={(values: Record<string, unknown>) => {
              if (isEdit) updateStudent.mutate({ id: data.id, data: values }, { onSuccess: handleSuccess });
              else createStudent.mutate(values as never, { onSuccess: handleSuccess });
            }}
          />
        );
      case "cluster":
        return (
          <InfraClusterForm
            initial={data}
            loading={createCluster.isPending || updateCluster.isPending}
            onSubmit={(values) => {
              if (isEdit) updateCluster.mutate({ id: data.id, data: values }, { onSuccess: handleSuccess });
              else createCluster.mutate(values, { onSuccess: handleSuccess });
            }}
          />
        );
      case "doc":
        return (
          <DocForm
            initial={data}
            loading={createDoc.isPending || updateDoc.isPending}
            onSubmit={(values) => {
              if (isEdit) updateDoc.mutate({ id: data.id, data: values }, { onSuccess: handleSuccess });
              else createDoc.mutate(values, { onSuccess: handleSuccess });
            }}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-5xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Edit the fields below and save." : "Fill in the fields below to create a new item."}
          </DialogDescription>
        </DialogHeader>
        {renderForm()}
        {isEdit && (
          <div className="flex justify-end pt-2 border-t border-border">
            <DeleteConfirmButton onConfirm={handleDelete} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditModal;
