import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import blog from "@/data/MOCKED_BLOG.json";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const blogImages = [
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=340&fit=crop",
  "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=600&h=340&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=340&fit=crop",
];

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
            <Link to={`/blog/${post.id}`} key={post.id}>
              <motion.article initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="bg-card rounded-xl border border-border hover:border-primary/30 transition-colors overflow-hidden cursor-pointer">
                <img
                  src={blogImages[i % blogImages.length]}
                  alt={isPt ? post.titlePt : post.title}
                  className="w-full h-44 object-cover"
                  loading="lazy"
                />
                <div className="p-6">
                  <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded">{post.tag}</span>
                  <h2 className="font-display text-xl font-semibold text-foreground mt-4 mb-3">{isPt ? post.titlePt : post.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{isPt ? post.excerptPt : post.excerpt}</p>
                  <time className="text-xs text-muted-foreground">{post.date}</time>
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
