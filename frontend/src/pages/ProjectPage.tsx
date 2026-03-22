import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { ArrowLeft, BookOpen, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import projects from "@/data/MOCKED_PROJECTS.json";
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
    <div className="py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link to="/research" className="text-primary hover:underline inline-flex items-center gap-2 mb-8 text-sm">
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

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {isPt ? project.titlePt : project.title}
          </h1>

          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            {isPt ? project.descriptionPt : project.description}
          </p>

          <div className="flex gap-6 text-sm text-muted-foreground mb-10 border-y border-border py-4">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={15} /> {project.publications} {isPt ? "publicações" : "publications"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={15} /> Impact: {project.impact}
            </span>
          </div>

          <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {isPt ? (project as any).contentPt : (project as any).content}
            </ReactMarkdown>
          </article>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectPage;