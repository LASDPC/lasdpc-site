import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Github, Linkedin, Mail, MapPin, Phone, Send } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import EditorialHero from "@/components/EditorialHero";

const EMAIL = "lasdpc@icmc.usp.br";
const DIRECTIONS_URL = "https://www.google.com/maps/search/?api=1&query=ICMC+USP+S%C3%A3o+Carlos";

const ContactPage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const reducedMotion = useReducedMotion();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const copy = isPt ? {
    eyebrow: "Contato · LaSDPC", titleA: "Boas ideias", titleB: "começam com uma conversa.",
    description: "Tem uma pergunta, uma proposta de parceria ou quer conhecer o laboratório? Vamos conversar.",
    explore: "Fale com a gente", visualEyebrow: "Uma linha direta", visualTitle: "Vamos construir a próxima conexão.",
    visualNote: "Pesquisa · Colaboração · Comunidade", channelsEyebrow: "Por onde começar",
    channelsTitle: "Estamos perto de você.", channelsDescription: "Escolha o canal mais conveniente para entrar em contato ou planejar sua visita.",
    emailTitle: "Escreva para nós", emailDescription: "Perguntas, ideias e oportunidades de colaboração.",
    phoneTitle: "Ligue para o ICMC", phoneDescription: "Contato telefônico da unidade.",
    visitTitle: "Venha nos visitar", visitDescription: "Encontre o laboratório no campus da USP em São Carlos.",
    formEyebrow: "Envie sua mensagem", formTitle: "O que você gostaria de conversar?",
    formDescription: "Preencha os campos e abriremos seu aplicativo de e-mail com a mensagem pronta para enviar.",
    namePlaceholder: "Como podemos chamar você?", emailPlaceholder: "voce@exemplo.com",
    messagePlaceholder: "Conte um pouco sobre sua ideia ou dúvida...", subject: "Contato pelo site do LaSDPC", from: "De",
    locationEyebrow: "Nossa localização", locationTitle: "São Carlos, SP", directions: "Como chegar", social: "Acompanhe o laboratório",
  } : {
    eyebrow: "Contact · LaSDPC", titleA: "Good ideas start", titleB: "with a conversation.",
    description: "Have a question, a partnership idea, or want to visit the lab? Let's talk.",
    explore: "Get in touch", visualEyebrow: "A direct line", visualTitle: "Let's make the next connection.",
    visualNote: "Research · Collaboration · Community", channelsEyebrow: "Where to start",
    channelsTitle: "We're within reach.", channelsDescription: "Choose the easiest way to reach us or plan your visit.",
    emailTitle: "Write to us", emailDescription: "Questions, ideas, and opportunities to collaborate.",
    phoneTitle: "Call the ICMC", phoneDescription: "The institute's phone number.",
    visitTitle: "Visit us", visitDescription: "Find the lab at USP's São Carlos campus.",
    formEyebrow: "Send a message", formTitle: "What would you like to discuss?",
    formDescription: "Fill in the fields and we'll open your email app with a message ready to send.",
    namePlaceholder: "What should we call you?", emailPlaceholder: "you@example.com",
    messagePlaceholder: "Tell us a little about your idea or question...", subject: "Contact from the LaSDPC website", from: "From",
    locationEyebrow: "Our location", locationTitle: "São Carlos, Brazil", directions: "Get directions", social: "Follow the lab",
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent(copy.subject);
    const body = encodeURIComponent(`${form.message.trim()}\n\n${form.name.trim()}\n${copy.from}: ${form.email.trim()}`);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  };
  const reveal = {
    initial: reducedMotion ? false : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: reducedMotion ? 0 : 0.55 },
  };
  const fieldClass = "w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";
  const channels = [
    { icon: Mail, title: copy.emailTitle, description: copy.emailDescription, value: EMAIL, href: `mailto:${EMAIL}` },
    { icon: Phone, title: copy.phoneTitle, description: copy.phoneDescription, value: "+55 (16) 3373-9700", href: "tel:+551633739700" },
    { icon: MapPin, title: copy.visitTitle, description: copy.visitDescription, value: "ICMC · USP, São Carlos", href: DIRECTIONS_URL },
  ];

  return (
    <div className="overflow-hidden">
      <EditorialHero
        eyebrow={copy.eyebrow}
        title={<>{copy.titleA}<br /><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{copy.titleB}</span></>}
        description={copy.description}
        action={copy.explore}
        target="#contact-options"
        visual={<div className="relative mx-auto flex h-[350px] max-w-[520px] items-center justify-center lg:h-[420px]" aria-hidden="true">
          <div className="absolute left-[5%] top-[10%] h-[72%] w-[78%] -rotate-6 rounded-[2rem] border border-primary/20 bg-primary/10" />
          <div className="absolute bottom-[4%] right-[3%] h-[72%] w-[78%] rotate-6 rounded-[2rem] border border-accent/25 bg-accent/10" />
          <div className="relative z-10 flex h-[80%] w-[78%] flex-col justify-between rounded-[2rem] border border-border bg-card p-5 shadow-2xl shadow-primary/10 sm:h-[76%] sm:p-9">
            <div className="flex items-center justify-between border-b border-border pb-4"><span className="font-mono text-[11px] font-bold uppercase tracking-[.2em] text-primary">LaSDPC / ICMC · USP</span><Mail size={24} strokeWidth={1.5} className="text-primary" /></div>
            <div><span className="font-mono text-[11px] font-bold uppercase tracking-[.18em] text-accent">{copy.visualEyebrow}</span><p className="mt-3 max-w-sm font-display text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">{copy.visualTitle}</p></div>
            <span className="text-xs text-muted-foreground">{copy.visualNote}</span>
          </div>
          <div className="absolute bottom-[1%] left-[2%] z-20 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-lg sm:h-16 sm:w-16"><Send size={25} strokeWidth={1.5} /></div>
        </div>}
        footer={<span className="font-mono text-xs font-bold uppercase tracking-[.18em] text-primary">ICMC · USP <span className="mx-3 text-border">/</span> São Carlos · SP</span>}
      />

      <section id="contact-options" className="container mx-auto scroll-mt-24 px-4 py-16 md:py-24">
        <motion.div {...reveal} className="mb-10 max-w-2xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[.2em] text-primary">{copy.channelsEyebrow}</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">{copy.channelsTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{copy.channelsDescription}</p>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-3">
          {channels.map((channel) => (
            <motion.a key={channel.title} {...reveal} href={channel.href} target={channel.icon === MapPin ? "_blank" : undefined} rel={channel.icon === MapPin ? "noopener noreferrer" : undefined} className="group flex min-h-[235px] flex-col rounded-[1.5rem] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <div className="flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><channel.icon size={22} strokeWidth={1.7} /></span><ArrowUpRight size={18} className="text-muted-foreground transition-colors group-hover:text-primary" /></div>
              <h3 className="mt-7 font-display text-xl font-bold text-foreground">{channel.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{channel.description}</p>
              <span className="mt-auto break-words pt-5 text-sm font-semibold text-primary">{channel.value}</span>
            </motion.a>
          ))}
        </div>
      </section>

      <section className="border-y border-border/70 bg-secondary/35">
        <div className="container mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,.95fr)] lg:gap-16 lg:py-24">
          <motion.div {...reveal} className="rounded-[2rem] border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-9">
            <p className="font-mono text-xs font-bold uppercase tracking-[.2em] text-primary">{copy.formEyebrow}</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{copy.formTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{copy.formDescription}</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label htmlFor="contact-name" className="mb-2 block text-sm font-semibold text-foreground">{t("contact.name")}</label><input id="contact-name" name="name" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={copy.namePlaceholder} className={fieldClass} required /></div>
                <div><label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-foreground">{t("contact.email")}</label><input id="contact-email" name="email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder={copy.emailPlaceholder} className={fieldClass} required /></div>
              </div>
              <div><label htmlFor="contact-message" className="mb-2 block text-sm font-semibold text-foreground">{t("contact.message")}</label><textarea id="contact-message" name="message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} rows={6} placeholder={copy.messagePlaceholder} className={`${fieldClass} min-h-[170px] resize-y`} required /></div>
              <button type="submit" className="group inline-flex items-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">{t("contact.send")}<Send size={17} className="transition-transform group-hover:translate-x-0.5" /></button>
            </form>
          </motion.div>

          <motion.div {...reveal} className="flex flex-col">
            <p className="font-mono text-xs font-bold uppercase tracking-[.2em] text-primary">{copy.locationEyebrow}</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{copy.locationTitle}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">{t("contact.address")}</p>
            <div className="mt-7 overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-lg shadow-primary/5">
              <iframe title={isPt ? "Mapa do ICMC-USP" : "Map of ICMC-USP"} src="https://www.google.com/maps?q=ICMC%20USP%20S%C3%A3o%20Carlos&output=embed" className="h-[300px] w-full sm:h-[360px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
              <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between border-t border-border bg-card px-5 py-4 text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"><span className="inline-flex items-center gap-2"><MapPin size={17} />{copy.directions}</span><ArrowUpRight size={17} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
            </div>
            <div className="mt-8 border-t border-border pt-6">
              <p className="text-sm font-semibold text-foreground">{copy.social}</p>
              <div className="mt-4 flex gap-3">
                <a href="https://github.com/lasdpc-icmc" target="_blank" rel="noopener noreferrer" aria-label="LaSDPC GitHub" className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Github size={19} /></a>
                <a href="https://linkedin.com/company/lasdpc" target="_blank" rel="noopener noreferrer" aria-label="LaSDPC LinkedIn" className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Linkedin size={19} /></a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
