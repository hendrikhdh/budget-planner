import { useState } from "react";
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

  const toggleTheme = () => setTheme(t => {
    const next = t === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    return next;
  });

  return { theme, toggleTheme, T: themes[theme], isDark: theme === "dark" };
}
