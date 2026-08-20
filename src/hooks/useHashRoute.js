import { useCallback, useEffect, useState } from "react";

// Seitenwechsel im URL-Fragment spiegeln. Ohne das riss jeder Zurück-Wisch aus
// der installierten PWA heraus und jeder Reload landete wieder auf "home".
//
// Bewusst Hash statt History-Routing: GitHub Pages kann keine Rewrites, ein
// direkter Aufruf von /budget-planner/budget wäre ein 404. Das Fragment kommt
// nie beim Server an und braucht keine Router-Bibliothek — die Seiten-IDs aus
// NAV_TABS sind bereits saubere Slugs.
const readHash = (validPages, fallback) => {
  if (typeof window === "undefined") return fallback;
  const raw = (window.location.hash || "").replace(/^#\/?/, "").split("?")[0];
  return validPages.includes(raw) ? raw : fallback;
};

export function useHashRoute(validPages, fallback = "home") {
  const [page, setPage] = useState(() => readHash(validPages, fallback));

  useEffect(() => {
    const onHashChange = () => setPage(readHash(validPages, fallback));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [validPages, fallback]);

  const navigate = useCallback((next) => {
    const target = validPages.includes(next) ? next : fallback;
    // Steht der Hash schon richtig (oder gar nicht, während der Fallback
    // gilt), löst das Schreiben kein hashchange aus — dann direkt setzen.
    if (readHash(validPages, fallback) === target) {
      setPage(target);
      return;
    }
    window.location.hash = `#/${target}`;
  }, [validPages, fallback]);

  return [page, navigate];
}
