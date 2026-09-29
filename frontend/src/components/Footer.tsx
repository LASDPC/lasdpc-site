import { Link } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { ArrowUpRight, Github, Linkedin, Mail, MapPin } from "lucide-react";
import logo from "@/assets/lasdpc-logo.png";

const Footer = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";

  const links = [
    { label: isPt ? "Pessoas" : "People", to: "/people" },
    { label: isPt ? "Pesquisa" : "Research", to: "/research" },
    { label: "Blog", to: "/blog" },
    { label: isPt ? "Contato" : "Contact", to: "/contact" },
  ];

  return (
    <footer className="relative mt-16 px-3 pb-3 sm:px-5">
      <div className="mx-auto max-w-[1480px] overflow-hidden rounded-[2rem] border border-border/80 bg-card/90 shadow-[0_-16px_50px_-42px_hsl(220_40%_2%/0.28)] backdrop-blur-2xl dark:bg-card/90 dark:shadow-none">
        <div className="relative px-6 py-12 sm:px-10 lg:px-14">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-[1.3fr_0.7fr_0.8fr]">
            <div className="max-w-xl">
              <Link to="/" className="mb-5 inline-flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                  <img src={logo} alt="" className="h-9 w-9 object-contain" />
                </span>
                <span>
                  <span className="block font-display text-xl font-bold tracking-tight text-foreground">LaSDPC</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">ICMC · Universidade de São Paulo</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {isPt
                  ? "Onde sistemas distribuídos, computação de alto desempenho e inteligência artificial se encontram para transformar pesquisa em impacto."
                  : "Where distributed systems, high-performance computing and artificial intelligence meet to turn research into impact."}
              </p>
              <div className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
                <span>{t("contact.address")}</span>
              </div>
            </div>

            <div>
              <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{isPt ? "Explore" : "Explore"}</p>
              <ul className="space-y-2.5">
                {links.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                      {item.label}<ArrowUpRight size={13} className="opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
                <li><Link to="/privacy-policy" className="text-sm font-medium text-muted-foreground hover:text-foreground">{isPt ? "Privacidade" : "Privacy"}</Link></li>
              </ul>
            </div>

            <div>
              <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{isPt ? "Conecte-se" : "Connect"}</p>
              <a href="mailto:lasdpc@icmc.usp.br" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
                <Mail size={16} /> lasdpc@icmc.usp.br
              </a>
              <div className="flex gap-2">
                <a href="https://github.com/lasdpc-icmc" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="control-button border border-border bg-background/80"><Github size={17} /></a>
                <a href="https://linkedin.com/company/lasdpc" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="control-button border border-border bg-background/80"><Linkedin size={17} /></a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/70 px-6 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-14">
          <p>© {new Date().getFullYear()} LaSDPC · ICMC-USP. {t("footer.rights")}</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em]">São Carlos · SP · Brasil</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
