import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import blog from "@/data/MOCKED_BLOG.json";
import { Skeleton } from "@/components/ui/skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const blogImages = [
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=340&fit=crop",
  "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=600&h=340&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=340&fit=crop",
];

const BlogPageSkeleton = () => (
  <div className="py-10">
    <div className="container mx-auto px-4">
      <Skeleton className="h-10 w-32 mb-4" />
      <Skeleton className="h-4 w-48 mb-2" />
      <Skeleton className="h-4 w-96 mb-12" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col bg-card rounded-xl border border-border overflow-hidden">
            <Skeleton className="w-full h-44 rounded-none" />
            <div className="p-6 flex flex-col gap-3">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-24 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const BlogPage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">{t("section.blog")}</h1>
        <p className="text-muted-foreground mb-2 text-sm font-mono">[MOCKED_BLOG.json]</p>
        <p className="text-xs text-muted-foreground mb-12 italic">
          {isPt ? "Nota: futura integração com LinkedIn/Instagram para publicação automática." : "Note: future LinkedIn/Instagram integration for auto-publishing."}
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blog.map((post, i) => (
            <Link to={`/blog/${post.id}`} key={post.id} className="h-full">
              <motion.article initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="flex flex-col h-full bg-card rounded-xl border border-border hover:border-primary/30 transition-colors overflow-hidden cursor-pointer">
                <img
                  src={blogImages[i % blogImages.length]}
                  alt={isPt ? post.titlePt : post.title}
                  className="w-full h-44 object-cover shrink-0"
                  loading="lazy"
                />
                <div className="p-6 flex flex-col flex-1">
                  <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded self-start shrink-0">{post.tag}</span>
                  <h2 className="font-display text-xl font-semibold text-foreground mt-4 mb-3 line-clamp-2 shrink-0">{isPt ? post.titlePt : post.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1 overflow-hidden">{isPt ? post.excerptPt : post.excerpt}</p>
                  <time className="text-xs text-muted-foreground shrink-0">{post.date}</time>
                </div>
              </motion.article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
