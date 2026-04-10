import { useEffect } from "react";
import { uid, getToday, dateStr } from "../utils/helpers.js";

// Auto-applies due recurring transactions to the entries list whenever the
// recurring definitions change.
export function useApplyRecurring(data, setData) {
  useEffect(() => {
    if (!data) return;
    const now = getToday();
    const applied = { ...data.appliedRecurring };
    const ne = [];
    (data.recurring || []).forEach(rec => {
      const sY = parseInt(rec.startYear);
      const sM = parseInt(rec.startMonth);
      const cy = parseInt(rec.cycle) || 1;
      const hasEnd = rec.endYear != null && rec.endYear !== "";
      const eY = hasEnd ? parseInt(rec.endYear) : null;
      const eM = hasEnd ? parseInt(rec.endMonth || 0) : null;
      let cY = sY, cM = sM;
      while (cY < now.year || (cY === now.year && cM <= now.month)) {
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
  }, [data && data.recurring]);
}
