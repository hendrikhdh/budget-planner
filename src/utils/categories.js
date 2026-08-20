import { parseLocalDate } from "./helpers.js";

export const CAT_COLORS = [
  { name: "Cyan", hex: "#00f0ff" },
  { name: "Magenta", hex: "#ff00e5" },
  { name: "Grün", hex: "#00e87b" },
  { name: "Orange", hex: "#ff6b35" },
  { name: "Lila", hex: "#7b61ff" },
  { name: "Gelb", hex: "#ffd60a" },
  { name: "Rosa", hex: "#ff3860" },
  { name: "Lime", hex: "#b0ff57" },
  { name: "Blau", hex: "#4d8bff" },
  { name: "Koralle", hex: "#ff9580" },
  { name: "Türkis", hex: "#14b8a6" },
  { name: "Violett", hex: "#a855f7" },
  { name: "Hellblau", hex: "#38bdf8" },
  { name: "Dunkelorange", hex: "#f97316" },
  { name: "Dunkelgrün", hex: "#16a34a" },
  { name: "Hellrosa", hex: "#f472b6" },
  { name: "Braun", hex: "#a16207" },
  { name: "Silber", hex: "#94a3b8" },
  { name: "Dunkelrot", hex: "#dc2626" },
  { name: "Indigo", hex: "#6366f1" },
];

export const DEFAULT_INCOME_CATS = [
  { name: "Gehalt", emoji: "💰", color: "#00e87b" }, { name: "Freelance", emoji: "💻", color: "#00f0ff" },
  { name: "Investitionen", emoji: "📈", color: "#7b61ff" }, { name: "Geschenke", emoji: "🎁", color: "#ff00e5" },
  { name: "Sonstiges", emoji: "📦", color: "#ffd60a" }
];

export const DEFAULT_EXPENSE_CATS = [
  { name: "Miete", emoji: "🏠", color: "#ff3860" }, { name: "Lebensmittel", emoji: "🛒", color: "#ff6b35" },
  { name: "Transport", emoji: "🚗", color: "#4d8bff" }, { name: "Unterhaltung", emoji: "🎮", color: "#7b61ff" },
  { name: "Gesundheit", emoji: "💊", color: "#00e87b" }, { name: "Kleidung", emoji: "👕", color: "#ff00e5" },
  { name: "Bildung", emoji: "📚", color: "#ffd60a" }, { name: "Abonnements", emoji: "📱", color: "#00f0ff" },
  { name: "Restaurant", emoji: "🍽️", color: "#ff9580" }, { name: "Sonstiges", emoji: "📦", color: "#b0ff57" }
];

export const catName = (c) => typeof c === "string" ? c : c.name;
export const catEmoji = (c) => typeof c === "string" ? "" : (c.emoji || "");
export const catColorVal = (c) => (typeof c === "string" ? CAT_COLORS[0].hex : c.color) || CAT_COLORS[0].hex;

export const sortCategoriesByUsage = (cats, entries, type, days = 30) => {
  const cutoff = Date.now() - days * 86400000;
  const counts = {};
  for (const e of entries || []) {
    if (type && e.type !== type) continue;
    if (parseLocalDate(e.date).getTime() < cutoff) continue;
    counts[e.category] = (counts[e.category] || 0) + 1;
  }
  return [...cats].sort((a, b) => {
    const ca = counts[catName(a)] || 0;
    const cb = counts[catName(b)] || 0;
    if (cb !== ca) return cb - ca;
    return catName(a).localeCompare(catName(b));
  });
};

export const groupByCategory = (entries) => {
  const g = {};
  entries.forEach(e => { g[e.category] = (g[e.category] || 0) + e.amount; });
  return Object.entries(g).map(([cat, val]) => ({ category: cat, value: val }));
};

export const createEmojiLookup = (categories) => (categoryName, type) => {
  const cats = type === "income" ? categories.income : categories.expense;
  const found = cats.find(c => catName(c) === categoryName);
  return found ? catEmoji(found) : "";
};

export const createColorLookup = (categories) => (categoryName, type) => {
  const cats = type === "income" ? categories.income : categories.expense;
  const found = cats.find(c => catName(c) === categoryName);
  return found ? catColorVal(found) : CAT_COLORS[0].hex;
};

// Sammelbecken für Einträge, deren Kategorie gelöscht wurde.
export const UNASSIGNED = "Nicht zugeordnet";

// Kategorien haben keine Id — entries, recurring und budgets referenzieren sie
// ausschließlich über den NAMEN. Umbenennen und Löschen müssen diese Referenzen
// deshalb mitziehen, sonst verlieren Einträge Farbe und Emoji, Budgets zählen
// ins Leere und wiederkehrende Regeln buchen auf eine Kategorie, die es nicht
// mehr gibt. Budgets existieren nur für Ausgaben.
export const renameCategory = (data, type, oldName, nextCat) => {
  const newName = catName(nextCat);
  const budgets = { ...(data.budgets || {}) };
  if (type === "expense" && Object.prototype.hasOwnProperty.call(budgets, oldName)) {
    budgets[newName] = budgets[oldName];
    delete budgets[oldName];
  }
  return {
    ...data,
    categories: {
      ...data.categories,
      [type]: (data.categories[type] || []).map(c => catName(c) === oldName ? nextCat : c),
    },
    entries: (data.entries || []).map(e => e.type === type && e.category === oldName ? { ...e, category: newName } : e),
    recurring: (data.recurring || []).map(r => r.type === type && r.category === oldName ? { ...r, category: newName } : r),
    budgets,
  };
};

export const removeCategory = (data, type, name) => {
  const budgets = { ...(data.budgets || {}) };
  if (type === "expense") delete budgets[name];
  return {
    ...data,
    categories: {
      ...data.categories,
      [type]: (data.categories[type] || []).filter(c => catName(c) !== name),
    },
    entries: (data.entries || []).map(e => e.type === type && e.category === name ? { ...e, category: UNASSIGNED } : e),
    recurring: (data.recurring || []).map(r => r.type === type && r.category === name ? { ...r, category: UNASSIGNED } : r),
    budgets,
  };
};

// Wie viele Datensätze eine Änderung berührt — für die Rückfrage vor dem Löschen.
export const countCategoryUsage = (data, type, name) => ({
  entries: (data.entries || []).filter(e => e.type === type && e.category === name).length,
  recurring: (data.recurring || []).filter(r => r.type === type && r.category === name).length,
  hasBudget: type === "expense" && (data.budgets || {})[name] !== undefined,
});
