import { useEffect, useState } from "react";
import { themes } from "../theme.js";

const THEME_KEY = "budget-planner-theme";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(THEME_KEY) : null;
    if (saved === "dark" || saved === "light") return saved;
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  // Die Browser- und Systemleiste soll die Farbe des aktiven Themes tragen.
  // Bisher stand dort ein festes Blau, das zu keinem der beiden Themes passte.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", themes[theme].bg);
  }, [theme]);

  // Systemwechsel übernehmen — aber nur, solange der Nutzer nicht selbst
  // gewählt hat. Eine explizite Wahl steht in localStorage und gewinnt.
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => {
      if (localStorage.getItem(THEME_KEY)) return;
      setTheme(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = () => setTheme(t => {
    const next = t === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    return next;
  });

  return { theme, toggleTheme, T: themes[theme], isDark: theme === "dark" };
}
