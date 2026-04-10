import { pad } from "./helpers.js";
import { DEFAULT_INCOME_CATS, DEFAULT_EXPENSE_CATS } from "./categories.js";

export const emptyData = () => ({
  entries: [], recurring: [],
  categories: { income: [], expense: [] },
  savingsGoals: [], appliedRecurring: {},
  budgets: {}, settings: {}
});

export const defaultData = () => {
  const now = new Date();
  const m = [0, 1, 2].map(offset => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return { month: d.getMonth(), year: d.getFullYear() };
  });
  const d = (monthOffset, day) => {
    const { month, year } = m[monthOffset];
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  };
  return {
    entries: [
      { id: "t01", type: "income",  category: "Gehalt",        amount: 3200,  description: "Monatsgehalt",          date: d(2, 2)  },
      { id: "t02", type: "income",  category: "Freelance",     amount: 450,   description: "Webdesign-Projekt",      date: d(2, 10) },
      { id: "t03", type: "expense", category: "Miete",         amount: 850,   description: "Miete",                  date: d(2, 1)  },
      { id: "t04", type: "expense", category: "Lebensmittel",  amount: 312,   description: "Wocheneinkäufe",        date: d(2, 5)  },
      { id: "t05", type: "expense", category: "Transport",     amount: 89,    description: "Monatsticket VRR",       date: d(2, 3)  },
      { id: "t06", type: "expense", category: "Abonnements",   amount: 45.97, description: "Netflix + Spotify + iCloud", date: d(2, 1) },
      { id: "t07", type: "expense", category: "Restaurant",    amount: 78,    description: "Abendessen Altstadt",    date: d(2, 17) },
      { id: "t08", type: "expense", category: "Kleidung",      amount: 129,   description: "Winterjacke Sale",       date: d(2, 12) },
      { id: "t09", type: "expense", category: "Gesundheit",    amount: 35,    description: "Apotheke",               date: d(2, 20) },
      { id: "t10", type: "expense", category: "Unterhaltung",  amount: 60,    description: "Konzertkarten",          date: d(2, 25) },
      { id: "t11", type: "expense", category: "Bildung",       amount: 24.99, description: "Udemy Kurs",             date: d(2, 15) },
      { id: "t12", type: "income",  category: "Gehalt",        amount: 3200,  description: "Monatsgehalt",           date: d(1, 2)  },
      { id: "t13", type: "income",  category: "Investitionen", amount: 120,   description: "Dividende ETF",          date: d(1, 15) },
      { id: "t14", type: "income",  category: "Geschenke",     amount: 50,    description: "Geburtstagsgeld",        date: d(1, 22) },
      { id: "t15", type: "expense", category: "Miete",         amount: 850,   description: "Miete",                  date: d(1, 1)  },
      { id: "t16", type: "expense", category: "Lebensmittel",  amount: 287,   description: "Wocheneinkäufe",        date: d(1, 6)  },
      { id: "t17", type: "expense", category: "Transport",     amount: 89,    description: "Monatsticket VRR",       date: d(1, 2)  },
      { id: "t18", type: "expense", category: "Abonnements",   amount: 45.97, description: "Netflix + Spotify + iCloud", date: d(1, 1) },
      { id: "t19", type: "expense", category: "Restaurant",    amount: 110,   description: "Dinner mit Freunden",    date: d(1, 14) },
      { id: "t20", type: "expense", category: "Unterhaltung",  amount: 42,    description: "Kino + Popcorn",         date: d(1, 8)  },
      { id: "t21", type: "expense", category: "Gesundheit",    amount: 90,    description: "Zahnarzt Zuzahlung",     date: d(1, 18) },
      { id: "t22", type: "expense", category: "Sonstiges",     amount: 65,    description: "Geschenk",               date: d(1, 13) },
      { id: "t23", type: "expense", category: "Lebensmittel",  amount: 58,    description: "Asiamarkt",              date: d(1, 20) },
      { id: "t24", type: "income",  category: "Gehalt",        amount: 3200,  description: "Monatsgehalt",           date: d(0, 2)  },
      { id: "t25", type: "income",  category: "Freelance",     amount: 800,   description: "Logo-Design Auftrag",    date: d(0, 8)  },
      { id: "t26", type: "income",  category: "Sonstiges",     amount: 35,    description: "Kleinanzeigen Verkauf",  date: d(0, 5)  },
      { id: "t27", type: "expense", category: "Miete",         amount: 850,   description: "Miete",                  date: d(0, 1)  },
      { id: "t28", type: "expense", category: "Lebensmittel",  amount: 295,   description: "Wocheneinkäufe",        date: d(0, 4)  },
      { id: "t29", type: "expense", category: "Transport",     amount: 89,    description: "Monatsticket VRR",       date: d(0, 2)  },
      { id: "t30", type: "expense", category: "Abonnements",   amount: 45.97, description: "Netflix + Spotify + iCloud", date: d(0, 1) },
      { id: "t31", type: "expense", category: "Restaurant",    amount: 52,    description: "Brunch mit Freunden",    date: d(0, 9)  },
      { id: "t32", type: "expense", category: "Bildung",       amount: 39.99, description: "Fachbuch",               date: d(0, 6)  },
      { id: "t33", type: "expense", category: "Lebensmittel",  amount: 47,    description: "Wochenmarkt",            date: d(0, 11) },
      { id: "t34", type: "expense", category: "Unterhaltung",  amount: 35,    description: "Bowling-Abend",          date: d(0, 7)  },
      { id: "t35", type: "expense", category: "Kleidung",      amount: 79,    description: "Sneakers",               date: d(0, 10) },
    ],
    recurring: [
      { id: "r01", type: "expense", category: "Miete",       amount: 850,   description: "Miete",           startMonth: m[2].month, startYear: m[2].year, cycle: 1, endMonth: null, endYear: null },
      { id: "r02", type: "expense", category: "Abonnements", amount: 45.97, description: "Streaming-Abos", startMonth: m[2].month, startYear: m[2].year, cycle: 1, endMonth: null, endYear: null },
      { id: "r03", type: "income",  category: "Gehalt",      amount: 3200,  description: "Monatsgehalt",    startMonth: m[2].month, startYear: m[2].year, cycle: 1, endMonth: null, endYear: null },
    ],
    categories: { income: [...DEFAULT_INCOME_CATS], expense: [...DEFAULT_EXPENSE_CATS] },
    savingsGoals: [
      { id: "sg1", name: "Urlaub Japan",    target: 3000, saved: 1250, emoji: "✈️" },
      { id: "sg2", name: "Notgroschen",     target: 5000, saved: 3800, emoji: "🛡️" },
      { id: "sg3", name: "Neues MacBook",   target: 2000, saved: 620,  emoji: "💻" },
    ],
    appliedRecurring: {},
    budgets: { "Lebensmittel": 400, "Restaurant": 150, "Unterhaltung": 100, "Kleidung": 150 },
    settings: {}
  };
};
