export const STORAGE_KEY = "tracksy-data";

export const CAT_COLORS = [
  "#0546ed", "#6a37d4", "#00647b", "#059669", "#e11d48",
  "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16",
];

export const DEFAULT_INCOME_CATS = [
  { name: "Gehalt", icon: "payments", color: "#059669" },
  { name: "Freelance", icon: "computer", color: "#06b6d4" },
  { name: "Investitionen", icon: "trending_up", color: "#8b5cf6" },
  { name: "Geschenke", icon: "redeem", color: "#ec4899" },
  { name: "Sonstiges", icon: "category", color: "#f59e0b" },
];

export const DEFAULT_EXPENSE_CATS = [
  { name: "Miete", icon: "home", color: "#0546ed" },
  { name: "Lebensmittel", icon: "shopping_cart", color: "#f59e0b" },
  { name: "Transport", icon: "directions_car", color: "#06b6d4" },
  { name: "Unterhaltung", icon: "sports_esports", color: "#8b5cf6" },
  { name: "Gesundheit", icon: "favorite", color: "#059669" },
  { name: "Kleidung", icon: "checkroom", color: "#ec4899" },
  { name: "Restaurant", icon: "restaurant", color: "#e11d48" },
  { name: "Abonnements", icon: "subscriptions", color: "#6a37d4" },
  { name: "Bildung", icon: "school", color: "#00647b" },
  { name: "Sonstiges", icon: "category", color: "#84cc16" },
];

export const CATEGORY_ICONS = {
  Gehalt: "payments",
  Freelance: "computer",
  Investitionen: "trending_up",
  Geschenke: "redeem",
  Miete: "home",
  Lebensmittel: "shopping_cart",
  Transport: "directions_car",
  Unterhaltung: "sports_esports",
  Gesundheit: "favorite",
  Kleidung: "checkroom",
  Restaurant: "restaurant",
  Abonnements: "subscriptions",
  Bildung: "school",
  Sonstiges: "category",
};

export const emptyData = () => ({
  entries: [],
  recurring: [],
  categories: {
    income: [...DEFAULT_INCOME_CATS],
    expense: [...DEFAULT_EXPENSE_CATS],
  },
  savingsGoals: [],
  budgets: {},
  settings: {},
});

export const getCategoryIcon = (categoryName) =>
  CATEGORY_ICONS[categoryName] || "category";

export const getCategoryColor = (categoryName, allCategories) => {
  if (!allCategories) return CAT_COLORS[0];
  const all = [...(allCategories.income || []), ...(allCategories.expense || [])];
  const found = all.find((c) => c.name === categoryName);
  return found?.color || CAT_COLORS[0];
};
