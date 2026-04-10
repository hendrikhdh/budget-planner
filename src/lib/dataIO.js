import { emptyData } from "../utils/data.js";

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
    const ta = document.getElementById("export-textarea");
    if (ta) { ta.select(); document.execCommand("copy"); return true; }
    return false;
  }
}

// Parse and validate an imported JSON file. Calls onMessage with a result
// object: { type: "success" | "error", title?, text }. Returns the sanitized
// data object on success or null on failure.
export function parseImportFile(file, onMessage) {
  return new Promise((resolve) => {
    if (!file) { resolve(null); return; }
    if (file.size > 5 * 1024 * 1024) {
      onMessage({ type: "error", text: "Die Datei ist zu groß (max. 5 MB)." });
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imp = JSON.parse(e.target.result);
        if (!imp || typeof imp !== "object" || Array.isArray(imp)) {
          onMessage({ type: "error", text: "Die Datei enthält keine gültigen Budget-Daten." });
          resolve(null);
          return;
        }
        if (!Array.isArray(imp.entries)) {
          onMessage({ type: "error", text: "Die Datei enthält keine gültigen Budget-Daten." });
          resolve(null);
          return;
        }
        const validTypes = ["income", "expense"];
        const validEntries = imp.entries.filter(entry =>
          entry && typeof entry === "object" &&
          validTypes.includes(entry.type) &&
          typeof entry.amount === "number" && isFinite(entry.amount) && entry.amount >= 0 && entry.amount <= 1_000_000 &&
          typeof entry.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
          typeof entry.category === "string" && entry.category.length <= 100 &&
          (entry.description === undefined || (typeof entry.description === "string" && entry.description.length <= 500))
        );
        if (validEntries.length === 0 && imp.entries.length > 0) {
          onMessage({ type: "error", text: "Keine gültigen Einträge gefunden. Bitte prüfe das Dateiformat." });
          resolve(null);
          return;
        }
        const sanitized = { ...emptyData(), ...imp, entries: validEntries };
        onMessage({ type: "success", title: "Import erfolgreich", text: `${validEntries.length} Einträge geladen aus „${file.name}".` });
        resolve(sanitized);
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
