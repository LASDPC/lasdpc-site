import React, { createContext, useContext, useState } from "react";
import ptBR from "@/data/i18n/pt-BR.json";
import enUS from "@/data/i18n/en-US.json";

type Lang = "pt-BR" | "en-US";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  "pt-BR": ptBR,
  "en-US": enUS,
};

const LangContext = createContext<LangContextType>({ lang: "pt-BR", setLang: () => {}, t: (k) => k });

export const useLang = () => useContext(LangContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("lasdpc-lang") as Lang) || "pt-BR");

  const t = (key: string): string => translations[lang]?.[key] ?? key;

  const handleSetLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("lasdpc-lang", l);
  };

  return <LangContext.Provider value={{ lang, setLang: handleSetLang, t }}>{children}</LangContext.Provider>;
};
