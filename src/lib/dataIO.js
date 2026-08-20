import { normalizeData } from "./normalizeData.js";

// Last data object that was successfully loaded into the app state. Kept here
// so the ErrorBoundary can still offer an export after a render crash, when the
// component tree that owned the state is already gone.
let lastSnapshot = null;
export const rememberSnapshot = (data) => { lastSnapshot = data; };
export const getSnapshot = () => lastSnapshot;

// Trigger a JSON-file download of the current data state.
export function downloadJSON(exportText) {
  try {
    const blob = new Blob([exportText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function copyExport(exportText) {
  try {
    await navigator.clipboard.writeText(exportText);
    return true;
  } catch {
    return false;
  }
}

// Parse and validate an imported JSON file. Calls onMessage with a result
// object: { type: "success" | "error", title?, text }. Returns the normalized
// data object on success or null on failure. Every field — not just entries —
// goes through normalizeData, so an imported file can never introduce a shape
// the app cannot render.
export function parseImportFile(file, onMessage) {
  return new Promise((resolve) => {
    if (!file) { resolve(null); return; }
    if (file.size > 5 * 1024 * 1024) {
      onMessage({ type: "error", text: "Die Datei ist zu groß (max. 5 MB)." });
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      onMessage({ type: "error", text: "Die Datei konnte nicht gelesen werden." });
      resolve(null);
    };
    reader.onload = (e) => {
      try {
        const imp = JSON.parse(e.target.result);
        if (!imp || typeof imp !== "object" || Array.isArray(imp) || !Array.isArray(imp.entries)) {
          onMessage({ type: "error", text: "Die Datei enthält keine gültigen Budget-Daten." });
          resolve(null);
          return;
        }
        const data = normalizeData(imp);
        const kept = data.entries.length;
        const dropped = imp.entries.length - kept;
        if (kept === 0 && imp.entries.length > 0) {
          onMessage({ type: "error", text: "Keine gültigen Einträge gefunden. Bitte prüfe das Dateiformat." });
          resolve(null);
          return;
        }
        onMessage({
          type: "success",
          title: "Import erfolgreich",
          text: `${kept} Einträge geladen aus „${file.name}".`
            + (dropped > 0 ? ` ${dropped} ungültige Einträge wurden übersprungen.` : ""),
        });
        resolve(data);
      } catch {
        onMessage({ type: "error", text: "Ungültige JSON-Datei. Bitte prüfe das Dateiformat." });
        resolve(null);
      }
    };
    reader.readAsText(file);
  });
}

export function groupByCategory(entries) {
  const g = {};
  entries.forEach(e => { g[e.category] = (g[e.category] || 0) + e.amount; });
  return Object.entries(g).map(([cat, val]) => ({ category: cat, value: val }));
}
