import { useLang } from "@/contexts/LanguageContext";
import { Github, Linkedin, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";

  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          <div>
            <p className="font-display text-lg font-bold text-foreground mb-2">LASDPC</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isPt
                ? "Laboratório de Sistemas Distribuídos e Programação Concorrente - ICMC-USP, São Carlos."
                : "Distributed Systems and Concurrent Programming Laboratory - ICMC-USP, São Carlos."}
            </p>
            <div className="flex items-start gap-2 mt-4 text-sm text-muted-foreground">
              <MapPin size={16} className="shrink-0 mt-0.5" />
              <span>{t("contact.address")}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Mail size={16} className="shrink-0" />
              <a href="mailto:lasdpc@icmc.usp.br" className="hover:text-primary transition-colors">lasdpc@icmc.usp.br</a>
            </div>
          </div>

          <div>
            <p className="font-display text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              {isPt ? "Conecte-se" : "Connect"}
            </p>
            <div className="flex gap-3 mb-6">
              <a href="https://github.com/lasdpc-icmc" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <Github size={18} />
              </a>
              <a href="https://linkedin.com/company/lasdpc" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <Linkedin size={18} />
              </a>
            </div>
            <p className="font-display text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">
              {isPt ? "Institucional" : "Institutional"}
            </p>
            <ul className="space-y-1.5">
              <li><a href="https://www.icmc.usp.br" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">ICMC-USP</a></li>
              <li><a href="https://www.usp.br" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">{isPt ? "Universidade de São Paulo" : "University of São Paulo"}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} LASDPC - ICMC-USP. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;