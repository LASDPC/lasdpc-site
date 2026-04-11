import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ExternalLink, Mail } from "lucide-react";
import { useDocentes, useStudents } from "@/hooks/usePeople";
import { Skeleton } from "@/components/ui/skeleton";
import PencilButton from "@/components/admin/PencilButton";
import AddNewButton from "@/components/admin/AddNewButton";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const PeoplePageSkeleton = () => (
  <div className="py-10">
    <div className="container mx-auto px-4">
      <Skeleton className="h-10 w-48 mb-4" /><Skeleton className="h-4 w-52 mb-12" />
      <div className="grid md:grid-cols-2 gap-6 mb-20">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-start gap-4">
              <Skeleton className="w-16 h-16 rounded-full shrink-0" />
              <div className="flex-1 space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-36" /><Skeleton className="h-4 w-44" /></div>
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-36 mb-8" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 border border-border space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-28" /></div>
        ))}
      </div>
    </div>
  </div>
);

const PeoplePage = () => {
  const { lang, t } = useLang();
  const { isAdmin } = useAuth();
  const isPt = lang === "pt-BR";
  const { data: docentes = [], isLoading: loadingDocentes } = useDocentes();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const navigate = useNavigate();

  if (loadingDocentes || loadingStudents) return <PeoplePageSkeleton />;

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-4xl font-bold text-foreground">{t("section.faculty")}</h1>
          {isAdmin && <AddNewButton label={isPt ? "Novo Docente" : "New Faculty"} onClick={() => navigate("/admin/edit/docente")} />}
        </div>
        <p className="text-muted-foreground mb-12 text-sm font-mono">{t("section.faculty")}</p>

        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {docentes.map((d, i) => (
            <div key={d.id} className="relative group">
              {isAdmin && <PencilButton onClick={() => navigate(`/admin/edit/docente/${d.id}`)} />}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="bg-card rounded-xl p-6 border border-border hover:glow-primary transition-shadow cursor-pointer"
                onClick={() => navigate(`/profile/${d.id}`)}
              >
                <div className="flex items-start gap-4">
                  {d.photo ? (
                    <img
                      src={d.photo}
                      alt={d.name}
                      className="w-16 h-16 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-xl shrink-0">
                      {d.initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-semibold text-foreground">{d.name}</h3>
                    <p className="text-sm text-muted-foreground">{isPt ? d.titlePt : d.title}</p>
                    <p className="text-sm text-accent mt-1">{isPt ? d.areaPt : d.area}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                      <a href={`mailto:${d.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><Mail size={12} /> Email</a>
                      {d.lattes && <a href={d.lattes} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><ExternalLink size={12} /> Lattes</a>}
                      {d.orcid && <a href={d.orcid} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><ExternalLink size={12} /> ORCID</a>}
                      {d.scholar && <a href={d.scholar} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><ExternalLink size={12} /> Scholar</a>}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-3xl font-bold text-foreground">{t("section.students")}</h2>
          {isAdmin && <AddNewButton label={isPt ? "Novo Aluno" : "New Student"} onClick={() => navigate("/admin/edit/student")} />}
        </div>
        <p className="text-muted-foreground mb-8 text-sm font-mono">{t("section.students")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s, i) => (
            <div key={s.id} className="relative group">
              {isAdmin && <PencilButton onClick={() => navigate(`/admin/edit/student/${s.id}`)} />}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="bg-card rounded-lg p-4 border border-border cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => navigate(`/profile/${s.id}`)}
              >
                <p className="font-semibold text-foreground">{s.name}</p>
                <p className="text-sm text-accent">{isPt ? s.levelPt : s.level}</p>
                <p className="text-xs text-muted-foreground mt-1">{isPt ? s.areaPt : s.area}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PeoplePage;
