import { Link } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Server, CalendarDays, CalendarClock } from "lucide-react";

const ReservaPage = () => {
  const { lang, t } = useLang();
  const isPt = lang === "pt-BR";
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">{t("infra.loginRequired")}</p>
      </div>
    );
  }

  return (
    <div className="py-10">
    <div className="container mx-auto px-4">
      <div className="flex items-center gap-3 mb-12">
        <CalendarDays className="h-8 w-8 text-primary" />
        <h1 className="font-display text-4xl font-bold text-foreground">
          {isPt ? "Reservas" : "Reservations"}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/infrastructure"
          className="group block rounded-xl bg-secondary p-8 text-center shadow-sm border border-border hover:border-primary hover:shadow-md transition-all duration-200"
        >
          <Server className="mx-auto mb-4 h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xl font-semibold text-foreground">
            {t("reserva.infraButton")}
          </span>
        </Link>

        <Link
          to="/room-scheduling"
          className="group block rounded-xl bg-secondary p-8 text-center shadow-sm border border-border hover:border-primary hover:shadow-md transition-all duration-200"
        >
          <CalendarDays className="mx-auto mb-4 h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xl font-semibold text-foreground">
            {t("reserva.roomButton")}
          </span>
        </Link>

        <Link
          to="/cluster-calendar"
          className="group block rounded-xl bg-secondary p-8 text-center shadow-sm border border-border hover:border-primary hover:shadow-md transition-all duration-200"
        >
          <CalendarClock className="mx-auto mb-4 h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xl font-semibold text-foreground">
            {t("reserva.clusterCalendarButton")}
          </span>
        </Link>
      </div>
    </div>
    </div>
  );
};

export default ReservaPage;
