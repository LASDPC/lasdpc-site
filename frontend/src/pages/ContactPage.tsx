import { useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { MapPin, Mail, Phone, Github, Linkedin, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const ContactPage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-4xl font-bold text-foreground mb-12">{t("section.contact")}</h1>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div initial="hidden" animate="visible">
            <form onSubmit={(e) => { e.preventDefault(); alert(isPt ? "Mensagem simulada enviada!" : "Mock message sent!"); }} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("contact.name")}</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-secondary text-secondary-foreground rounded-lg px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("contact.email")}</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-secondary text-secondary-foreground rounded-lg px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{t("contact.message")}</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} className="w-full bg-secondary text-secondary-foreground rounded-lg px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-none" required />
              </div>
              <button type="submit" className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                <Send size={16} />
                {t("contact.send")}
              </button>
            </form>
          </motion.div>

          <motion.div initial="hidden" animate="visible" className="space-y-8">
            <div className="relative w-full h-64 rounded-xl overflow-hidden border border-border">
              {!mapLoaded && (
                <Skeleton className="absolute inset-0 w-full h-full rounded-xl" />
              )}
              <iframe
                title="ICMC-USP"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3699.0!2d-47.897!3d-22.007!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94b877b0f96e0001%3A0x1234567890!2sICMC-USP!5e0!3m2!1spt-BR!2sbr!4v1700000000000"
                className={`w-full h-full transition-opacity duration-500 ${mapLoaded ? "opacity-100" : "opacity-0"}`}
                loading="lazy"
                allowFullScreen
                onLoad={() => setMapLoaded(true)}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{t("contact.address")}</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-primary shrink-0" />
                <a href="mailto:lasdpc@icmc.usp.br" className="text-sm text-foreground hover:text-primary transition-colors">lasdpc@icmc.usp.br</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-primary shrink-0" />
                <span className="text-sm text-foreground">+55 (16) 3373-9700</span>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">{isPt ? "Redes Sociais" : "Social Media"}</p>
              <div className="flex gap-3">
                <a href="https://github.com/lasdpc-icmc" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-secondary text-foreground hover:border-primary hover:text-primary transition-colors">
                  <Github size={20} />
                </a>
                <a href="https://linkedin.com/company/lasdpc" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-secondary text-foreground hover:border-primary hover:text-primary transition-colors">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
