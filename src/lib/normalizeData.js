import { emptyData } from "../utils/data.js";
import { uid } from "../utils/helpers.js";

// Single gatekeeper for every data object that enters the app state — from
// Firestore as well as from an imported JSON file. Nothing is spread through
// unchecked: each field is rebuilt from validated primitives, unknown keys are
// dropped. A corrupt or hand-crafted source can therefore no longer put the
// app into a state where rendering throws.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;

const isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const asArray = (v) => (Array.isArray(v) ? v : []);
const asText = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");

const asNumber = (v) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
};
// Rejects only what would break aggregation or rendering (NaN, negative).
// Upper bounds are a form-validation concern — enforcing them here would
// silently delete legitimate records on load.
const asAmount = (v) => {
  const n = asNumber(v);
  return n !== null && n >= 0 ? n : null;
};
const asInt = (v, min, max) => {
  const n = typeof v === "number" ? v : parseInt(v, 10);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

// Reuses the source id when it is a usable, not-yet-seen string; mints a fresh
// one otherwise. Guarantees unique ids so that delete/edit by id never matches
// more than one record.
const takeId = (raw, seen) => {
  let id = typeof raw === "string" && raw.length > 0 && raw.length <= 64 ? raw : uid();
  if (seen.has(id)) id = uid();
  seen.add(id);
  return id;
};

const normalizeEntry = (raw, seen) => {
  if (!isPlainObject(raw)) return null;
  if (raw.type !== "income" && raw.type !== "expense") return null;
  const amount = asAmount(raw.amount);
  if (amount === null) return null;
  if (typeof raw.date !== "string" || !DATE_RE.test(raw.date)) return null;
  const entry = {
    id: takeId(raw.id, seen),
    type: raw.type,
    category: asText(raw.category, 100),
    amount,
    description: asText(raw.description, 500),
    date: raw.date,
  };
  if (typeof raw.savingsGoalId === "string" && raw.savingsGoalId) {
    entry.savingsGoalId = raw.savingsGoalId.slice(0, 64);
  }
  return entry;
};

// Categories exist in two shapes: legacy plain strings and { name, emoji, color }.
// Both stay supported — catName/catEmoji/catColorVal already handle them.
const normalizeCategory = (raw) => {
  if (typeof raw === "string") return raw.length > 0 ? raw.slice(0, 100) : null;
  if (!isPlainObject(raw) || typeof raw.name !== "string" || raw.name.length === 0) return null;
  const cat = { name: raw.name.slice(0, 100), emoji: asText(raw.emoji, 8) };
  if (typeof raw.color === "string" && HEX_RE.test(raw.color)) cat.color = raw.color;
  return cat;
};

const normalizeRecurring = (raw, seen) => {
  if (!isPlainObject(raw)) return null;
  if (raw.type !== "income" && raw.type !== "expense") return null;
  const amount = asAmount(raw.amount);
  const startMonth = asInt(raw.startMonth, 0, 11);
  const startYear = asInt(raw.startYear, 1900, 3000);
  if (amount === null || startMonth === null || startYear === null) return null;
  const endYear = asInt(raw.endYear, 1900, 3000);
  const endMonth = asInt(raw.endMonth, 0, 11);
  return {
    id: takeId(raw.id, seen),
    type: raw.type,
    category: asText(raw.category, 100),
    amount,
    description: asText(raw.description, 500),
    startMonth,
    startYear,
    cycle: asInt(raw.cycle, 1, 120) ?? 1,
    endMonth: endYear === null ? null : endMonth,
    endYear,
  };
};

const normalizeGoal = (raw, seen) => {
  if (!isPlainObject(raw) || typeof raw.name !== "string" || raw.name.length === 0) return null;
  const target = asAmount(raw.target);
  const saved = asAmount(raw.saved);
  return {
    id: takeId(raw.id, seen),
    name: raw.name.slice(0, 100),
    emoji: asText(raw.emoji, 8),
    target: target ?? 0,
    saved: saved ?? 0,
  };
};

const normalizeAsset = (raw, seen) => {
  if (!isPlainObject(raw) || typeof raw.name !== "string" || raw.name.length === 0) return null;
  const history = asArray(raw.history)
    .filter(h => isPlainObject(h) && typeof h.date === "string" && DATE_RE.test(h.date) && asNumber(h.value) !== null)
    .map(h => ({ date: h.date, value: asNumber(h.value) }));
  const asset = {
    id: takeId(raw.id, seen),
    name: raw.name.slice(0, 100),
    emoji: asText(raw.emoji, 8),
    value: asNumber(raw.value) ?? 0,
  };
  // Only attach history when there is a usable one — assetHistory() synthesizes
  // a single point from `value` for legacy assets without it.
  if (history.length > 0) asset.history = history;
  return asset;
};

const normalizeBudgets = (raw) => {
  const out = {};
  if (!isPlainObject(raw)) return out;
  for (const [category, limit] of Object.entries(raw)) {
    const n = asAmount(limit);
    if (n !== null && category.length <= 100) out[category] = n;
  }
  return out;
};

const normalizeAppliedRecurring = (raw) => {
  const out = {};
  if (!isPlainObject(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (value) out[key] = true;
  }
  return out;
};

// Settings is a flat bag of primitives; passing unknown primitive keys through
// keeps an older build from silently deleting a newer build's setting.
const normalizeSettings = (raw) => {
  const out = {};
  if (!isPlainObject(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    const t = typeof value;
    if (t === "string" || t === "number" || t === "boolean") out[key] = value;
  }
  return out;
};

const normalizeList = (raw, normalize) => {
  const seen = new Set();
  return asArray(raw).map(item => normalize(item, seen)).filter(Boolean);
};

export function normalizeData(raw) {
  const base = emptyData();
  if (!isPlainObject(raw)) return base;
  return {
    entries: normalizeList(raw.entries, normalizeEntry),
    recurring: normalizeList(raw.recurring, normalizeRecurring),
    categories: {
      income: asArray(isPlainObject(raw.categories) ? raw.categories.income : null).map(normalizeCategory).filter(Boolean),
      expense: asArray(isPlainObject(raw.categories) ? raw.categories.expense : null).map(normalizeCategory).filter(Boolean),
    },
    savingsGoals: normalizeList(raw.savingsGoals, normalizeGoal),
    assets: normalizeList(raw.assets, normalizeAsset),
    appliedRecurring: normalizeAppliedRecurring(raw.appliedRecurring),
    budgets: normalizeBudgets(raw.budgets),
    settings: normalizeSettings(raw.settings),
  };
}
