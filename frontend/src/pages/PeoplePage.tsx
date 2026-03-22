import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { ExternalLink, Mail } from "lucide-react";
import docentes from "@/data/MOCKED_DOCENTES.json";
import students from "@/data/MOCKED_STUDENTS.json";
import { Skeleton } from "@/components/ui/skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const PeoplePageSkeleton = () => (
  <div className="py-10">
    <div className="container mx-auto px-4">
      <Skeleton className="h-10 w-48 mb-4" />
      <Skeleton className="h-4 w-52 mb-12" />
      <div className="grid md:grid-cols-2 gap-6 mb-20">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-start gap-4">
              <Skeleton className="w-16 h-16 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-44" />
                <div className="flex gap-3 mt-3">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-36 mb-4" />
      <Skeleton className="h-4 w-48 mb-8" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 border border-border space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PeoplePage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">{t("section.faculty")}</h1>
        <p className="text-muted-foreground mb-12 text-sm font-mono">[MOCKED_DOCENTES.json]</p>

        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {docentes.map((d, i) => (
            <motion.div key={d.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="bg-card rounded-xl p-6 border border-border hover:glow-primary transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-xl shrink-0">
                  {d.name.split(" ").filter((_, j) => j === 0 || j === d.name.split(" ").length - 1).map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-semibold text-foreground">{d.name}</h3>
                  <p className="text-sm text-muted-foreground">{isPt ? d.rolePt : d.role}</p>
                  <p className="text-sm text-accent mt-1">{isPt ? d.areaPt : d.area}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs">
                    <a href={`mailto:${d.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><Mail size={12} /> Email</a>
                    <a href={d.lattes} target="_blank" rel="noopener" className="flex items-center gap-1 text-muted-foreground hover:text-primary"><ExternalLink size={12} /> Lattes</a>
                    <a href={d.orcid} target="_blank" rel="noopener" className="flex items-center gap-1 text-muted-foreground hover:text-primary"><ExternalLink size={12} /> ORCID</a>
                    <a href={d.scholar} target="_blank" rel="noopener" className="flex items-center gap-1 text-muted-foreground hover:text-primary"><ExternalLink size={12} /> Scholar</a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <h2 className="font-display text-3xl font-bold text-foreground mb-4">{t("section.students")}</h2>
        <p className="text-muted-foreground mb-8 text-sm font-mono">[MOCKED_STUDENTS.json]</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s, i) => (
            <motion.div key={s.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="bg-card rounded-lg p-4 border border-border">
              <p className="font-semibold text-foreground">{s.name}</p>
              <p className="text-sm text-accent">{isPt ? s.levelPt : s.level}</p>
              <p className="text-xs text-muted-foreground mt-1">{isPt ? s.areaPt : s.area}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PeoplePage;
