import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import projects from "@/data/MOCKED_PROJECTS.json";
import publications from "@/data/MOCKED_PUBLICATIONS.json";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const ResearchPage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-4xl font-bold text-foreground mb-12">{t("section.research")}</h1>

        <h2 className="font-display text-2xl font-bold text-foreground mb-6">{t("section.projects")}</h2>
        <p className="text-muted-foreground mb-8 text-sm font-mono">[MOCKED_PROJECTS.json]</p>
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {projects.map((p, i) => (
            <Link to={`/research/${p.id}`} key={p.id}>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map(tag => <span key={tag} className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{tag}</span>)}
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${p.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                    {p.status}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{isPt ? p.titlePt : p.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{isPt ? p.descriptionPt : p.description}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{p.publications} {isPt ? "publicações" : "publications"}</span>
                  <span>Impact: {p.impact}</span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        <h2 className="font-display text-2xl font-bold text-foreground mb-6">{t("section.publications")}</h2>
        <p className="text-muted-foreground mb-8 text-sm font-mono">[MOCKED_PUBLICATIONS.json]</p>
        <div className="space-y-4">
          {publications.map((pub, i) => (
            <motion.a key={pub.id} href={pub.doi} target="_blank" rel="noopener noreferrer" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="block bg-card rounded-lg p-5 border border-border hover:border-primary/50 transition-colors">
              <p className="font-semibold text-foreground">{isPt ? pub.titlePt : pub.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{pub.authors} - <em>{pub.venue}</em>, {pub.year}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResearchPage;
