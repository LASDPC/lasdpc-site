import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { ArrowLeft, Calendar, Tag, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import blog from "@/data/MOCKED_BLOG.json";
import { Skeleton } from "@/components/ui/skeleton";

const blogImages = [
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&h=500&fit=crop",
];

const BlogPostPageSkeleton = () => (
  <div className="py-10">
    <div className="container mx-auto px-4 max-w-3xl">
      <Skeleton className="h-4 w-28 mb-8" />
      <Skeleton className="w-full h-64 sm:h-80 rounded-xl mb-8" />
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-5 w-28" />
      </div>
      <Skeleton className="h-10 w-full mb-3" />
      <Skeleton className="h-10 w-3/4 mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  </div>
);

const BlogPostPage = () => {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLang();
  const isPt = lang === "pt-BR";
  const postIndex = blog.findIndex((p) => p.id === id);
  const post = blog[postIndex];

  if (!post) {
    return (
      <div className="py-10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            {isPt ? "Post não encontrado" : "Post not found"}
          </h1>
          <Link to="/blog" className="text-primary hover:underline inline-flex items-center gap-2">
            <ArrowLeft size={16} /> {isPt ? "Voltar ao blog" : "Back to blog"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link to="/blog" className="text-primary hover:underline inline-flex items-center gap-2 mb-8 text-sm">
            <ArrowLeft size={16} /> {isPt ? "Voltar ao blog" : "Back to blog"}
          </Link>

          <img
            src={blogImages[postIndex % blogImages.length]}
            alt={isPt ? post.titlePt : post.title}
            className="w-full h-64 sm:h-80 object-cover rounded-xl mb-8"
          />

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="inline-flex items-center gap-1.5">
              <Tag size={14} />
              <span className="font-mono bg-accent/10 text-accent px-2 py-0.5 rounded text-xs">{post.tag}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} /> {post.date}
            </span>
            {"author" in post && (
              <span className="inline-flex items-center gap-1.5">
                <User size={14} /> {post.author}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-8">
            {isPt ? post.titlePt : post.title}
          </h1>

          <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {isPt ? (post as any).contentPt : (post as any).content}
            </ReactMarkdown>
          </article>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogPostPage;