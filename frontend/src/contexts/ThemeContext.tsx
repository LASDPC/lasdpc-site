import React, { createContext, useContext, useState, useEffect, useRef } from "react";

type Theme = "light" | "dark" | "high-contrast";
type FontSize = "normal" | "large" | "x-large";

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  fontSize: FontSize;
  setFontSize: (f: FontSize) => void;
  toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light", setTheme: () => {}, fontSize: "normal", setFontSize: () => {}, toggleHighContrast: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const fontSizeMap: Record<FontSize, string> = {
  normal: "100%",
  large: "118%",
  "x-large": "140%",
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("lasdpc-theme") as Theme) || "light");
  const [fontSize, setFontSize] = useState<FontSize>(() => (localStorage.getItem("lasdpc-font-size") as FontSize) || "normal");
  const prevThemeRef = useRef<Theme>(
    (() => {
      const stored = localStorage.getItem("lasdpc-prev-theme") as Theme | null;
      return stored && stored !== "high-contrast" ? stored : "light";
    })()
  );

  const toggleHighContrast = () => {
    if (theme === "high-contrast") {
      setTheme(prevThemeRef.current as Theme);
    } else {
      prevThemeRef.current = theme;
      localStorage.setItem("lasdpc-prev-theme", theme);
      setTheme("high-contrast");
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "high-contrast");
    if (theme === "dark") root.classList.add("dark");
    else if (theme === "high-contrast") root.classList.add("high-contrast");
    localStorage.setItem("lasdpc-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSizeMap[fontSize];
    localStorage.setItem("lasdpc-font-size", fontSize);
  }, [fontSize]);

  return <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize, toggleHighContrast }}>{children}</ThemeContext.Provider>;
};