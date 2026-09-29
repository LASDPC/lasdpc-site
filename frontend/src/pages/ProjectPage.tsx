import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { ArrowLeft, BookOpen, Users, ExternalLink, Github } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { urlTransform } from "@/lib/markdown";
import { mediaUrl } from "@/lib/media";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";

const ProjectPageSkeleton = () => (
  <div className="py-10">
    <div className="container mx-auto px-4 max-w-3xl">
      <Skeleton className="h-4 w-36 mb-8" />
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-6 w-14 rounded" />
      </div>
      <Skeleton className="h-11 w-full mb-3" />
      <Skeleton className="h-11 w-3/4 mb-4" />
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-5/6 mb-8" />
      <div className="flex gap-6 border-y border-border py-4 mb-10">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  </div>
);

const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLang();
  const isPt = lang === "pt-BR";
  const { data: projects = [], isLoading } = useProjects();

  if (isLoading) return <ProjectPageSkeleton />;

  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="py-10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            {isPt ? "Projeto não encontrado" : "Project not found"}
          </h1>
          <Link to="/research" className="text-primary hover:underline inline-flex items-center gap-2">
            <ArrowLeft size={16} /> {isPt ? "Voltar à pesquisa" : "Back to research"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="editorial-detail px-4 pb-20 pt-16 md:pt-24">
        <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link to="/research" className="mb-10 inline-flex items-center gap-2 rounded-full border border-border bg-card/75 px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/40 hover:bg-card">
            <ArrowLeft size={16} /> {isPt ? "Voltar à pesquisa" : "Back to research"}
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            {project.tags.map((tag) => (
              <span key={tag} className="text-xs font-mono bg-primary/10 text-primary px-2.5 py-1 rounded">{tag}</span>
            ))}
            <span className={`text-xs font-mono px-2.5 py-1 rounded ${project.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
              {project.status === "active" ? (isPt ? "Ativo" : "Active") : (isPt ? "Concluído" : "Completed")}
            </span>
          </div>

          <h1 className="font-display font-bold text-foreground">
            {isPt ? project.titlePt : project.title}
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {isPt ? project.descriptionPt : project.description}
          </p>
        </motion.div>
        </div>
      </div>
      <div className="container mx-auto max-w-4xl px-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.12 }}>

          {project.image && (
            <img
              src={mediaUrl(project.image)}
              alt={isPt ? project.titlePt : project.title}
              className="relative -mt-10 mb-8 w-full rounded-3xl border border-border object-cover shadow-xl"
            />
          )}

          <div className="mb-8 flex flex-wrap gap-6 rounded-2xl border border-border bg-card/85 px-6 py-5 text-sm text-muted-foreground shadow-sm">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={15} /> {project.publications} {isPt ? "publicações" : "publications"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={15} /> Impact: {project.impact}
            </span>
            {project.website && (
              <a href={project.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                <ExternalLink size={15} /> {isPt ? "Site" : "Website"}
              </a>
            )}
            {project.github && (
              <a href={project.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                <Github size={15} /> GitHub
              </a>
            )}
          </div>

          <article className="editorial-article !mt-0 prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform}>
              {isPt ? project.contentPt : project.content}
            </ReactMarkdown>
          </article>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectPage;
