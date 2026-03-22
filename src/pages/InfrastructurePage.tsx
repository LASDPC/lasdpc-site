import { useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { Cpu, HardDrive, MemoryStick, Activity } from "lucide-react";
import infra from "@/data/MOCKED_INFRASTRUCTURE.json";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const UsageBar = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full hero-gradient-bg transition-all duration-700" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const InfrastructurePage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const [form, setForm] = useState({ resource: infra.resources[0], date: "" });

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">{t("section.infrastructure")}</h1>
        <p className="text-muted-foreground mb-12 text-sm font-mono">[MOCKED_INFRASTRUCTURE.json]</p>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {infra.clusters.map((c, i) => (
            <motion.div key={c.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold text-foreground">{c.name}</h3>
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${c.status === "online" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>
                  {c.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-5">{isPt ? c.descriptionPt : c.description}</p>
              <div className="space-y-3">
                <UsageBar label="CPU" value={c.cpuUsage} />
                <UsageBar label="GPU" value={c.gpuUsage} />
                <UsageBar label="Memory" value={c.memoryUsage} />
                <UsageBar label="Storage" value={c.storageUsage} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reservation Form */}
        <div className="max-w-lg">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">{t("reservation.title")}</h2>
          <form onSubmit={(e) => { e.preventDefault(); alert(isPt ? "Reserva simulada enviada!" : "Mock reservation submitted!"); }} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">{t("reservation.resource")}</label>
              <select value={form.resource} onChange={e => setForm({ ...form, resource: e.target.value })} className="w-full bg-secondary text-secondary-foreground rounded-lg px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring">
                {infra.resources.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">{t("reservation.date")}</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full bg-secondary text-secondary-foreground rounded-lg px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button type="submit" className="hero-gradient-bg text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
              {t("reservation.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InfrastructurePage;
