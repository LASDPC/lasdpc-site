import { Link } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Server, CalendarDays, CalendarClock } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const ReservaPage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="surface-panel rounded-3xl p-10 text-center"><CalendarDays className="mx-auto mb-4 h-10 w-10 text-primary" /><p className="text-muted-foreground">{t("infra.loginRequired")}</p><Link to="/login" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">{isPt ? "Entrar" : "Sign in"}</Link></div>
      </div>
    );
  }

  return (
    <div>
    <PageHeader
      icon={CalendarDays}
      title={isPt ? "Reservas" : "Reservations"}
      subtitle={t("reserva.subtitle")}
      eyebrow={isPt ? "Espaços e recursos" : "Spaces and resources"}
    />
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/infrastructure"
          className="group surface-panel interactive-card block rounded-3xl p-8 text-left sm:p-10"
        >
          <Server className="mb-10 h-12 w-12 text-primary transition-transform group-hover:scale-110" />
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            {t("reserva.infraButton")}
          </span>
        </Link>

        <Link
          to="/room-scheduling"
          className="group surface-panel interactive-card block rounded-3xl p-8 text-left sm:p-10"
        >
          <CalendarDays className="mb-10 h-12 w-12 text-primary transition-transform group-hover:scale-110" />
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            {t("reserva.roomButton")}
          </span>
        </Link>

        <Link
          to="/cluster-calendar"
          className="group surface-panel interactive-card block rounded-3xl p-8 text-left sm:p-10"
        >
          <CalendarClock className="mb-10 h-12 w-12 text-primary transition-transform group-hover:scale-110" />
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            {t("reserva.clusterCalendarButton")}
          </span>
        </Link>
      </div>
    </div>
    </div>
  );
};

export default ReservaPage;
