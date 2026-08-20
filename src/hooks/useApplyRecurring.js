import { useEffect, useState } from "react";
import { uid, getToday, dateStr, todayISO } from "../utils/helpers.js";

// Obergrenze pro Regel: 100 Jahre monatlich. Ohne sie erzeugte ein vertipptes
// Startjahr (z. B. "202" statt "2026") synchron zehntausende Einträge, fror die
// UI ein und sprengte das Firestore-Dokument.
const MAX_OCCURRENCES = 1200;

// Auto-applies due recurring transactions to the entries list.
export function useApplyRecurring(data, setData) {
  // Der Effekt wertet das heutige Datum aus, hängt aber nur an data.recurring.
  // Bleibt die installierte PWA über den Monatswechsel im Hintergrund, würden
  // Miete und Gehalt sonst erst bei der nächsten Datenänderung gebucht.
  const [todayKey, setTodayKey] = useState(todayISO);
  useEffect(() => {
    const sync = () => setTodayKey(todayISO());
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    const now = getToday();
    const applied = { ...data.appliedRecurring };
    const ne = [];
    (data.recurring || []).forEach(rec => {
      const sY = parseInt(rec.startYear, 10);
      const sM = parseInt(rec.startMonth, 10);
      const cy = parseInt(rec.cycle, 10) || 1;
      // Unbrauchbare Regeln überspringen, statt mit NaN in die Schleife zu gehen.
      if (!Number.isInteger(sY) || !Number.isInteger(sM) || sM < 0 || sM > 11) return;
      const hasEnd = rec.endYear != null && rec.endYear !== "";
      const eY = hasEnd ? parseInt(rec.endYear, 10) : null;
      // Altdaten können ein Endjahr ohne Endmonat haben; dort bleibt es beim
      // bisherigen Januar. Neue Regeln verlangen beide Felder (RecurringPage).
      const eM = hasEnd ? parseInt(rec.endMonth || 0, 10) : null;
      let cY = sY, cM = sM;
      let guard = 0;
      while (cY < now.year || (cY === now.year && cM <= now.month)) {
        if (guard >= MAX_OCCURRENCES) {
          console.warn("[Money Maker] Wiederkehrende Regel abgebrochen (Obergrenze erreicht):", rec.id);
          break;
        }
        guard++;
        if (hasEnd && (cY > eY || (cY === eY && cM > eM))) break;
        const key = `${rec.id}_${cY}_${cM}`;
        if (!applied[key]) {
          applied[key] = true;
          ne.push({
            id: uid(),
            type: rec.type,
            category: rec.category,
            amount: parseFloat(rec.amount),
            description: rec.description + " (wiederkehrend)",
            date: dateStr(cY, cM, 1),
          });
        }
        cM += cy;
        while (cM > 11) { cM -= 12; cY++; }
      }
    });
    if (ne.length > 0) {
      setData(prev => prev ? ({ ...prev, entries: [...prev.entries, ...ne], appliedRecurring: applied }) : prev);
    }
  }, [data && data.recurring, todayKey]);
}
