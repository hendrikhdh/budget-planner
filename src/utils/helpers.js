export const uid = () => crypto.randomUUID().replace(/-/g, "");
export const fmt = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
export const fmtWhole = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
export const fmtShort = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : Math.round(n).toString();
export const monthName = (m, y) => new Date(y, m).toLocaleString("de-DE", { month: "long", year: "numeric" });
export const getToday = () => { const d = new Date(); return { month: d.getMonth(), year: d.getFullYear(), day: d.getDate() }; };
export const pad = (n) => String(n).padStart(2, "0");
export const dateStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
export const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

// Returns the chronologically sorted history of an asset. Legacy assets without a `history` field
// get a synthetic single point with today's date and their current `value`.
export const assetHistory = (a) => {
  if (Array.isArray(a.history) && a.history.length > 0) {
    return [...a.history].sort((x, y) => x.date.localeCompare(y.date));
  }
  return [{ date: todayISO(), value: Number(a.value) || 0 }];
};

// Returns the asset's value at a given ISO date string (latest history point with date <= dateStr).
// If all history points are after dateStr, returns the earliest point's value.
export const assetValueAt = (a, dateStr) => {
  const h = assetHistory(a);
  let v = h[0].value;
  for (const p of h) { if (p.date <= dateStr) v = p.value; else break; }
  return v;
};

// Builds a series of total-wealth snapshots, one per month-end, for the last `monthsBack` months.
// total = Σ assetValueAt(asset, monthEnd) + Σ balance of all month-balances with (year, month) <= cursor.
export const computeTotalSeries = (assets, entries, monthsBack = 12) => {
  const monthly = computeMonthlyBalances(entries); // newest first
  const monthlyAsc = [...monthly].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  const now = new Date();
  const result = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0); // last day of month (i months ago)
    const monthEnd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const y = d.getFullYear(), m = d.getMonth();
    const monthsCumulative = monthlyAsc
      .filter(b => b.year < y || (b.year === y && b.month <= m))
      .reduce((s, b) => s + b.balance, 0);
    const assetsSum = (assets || []).reduce((s, a) => s + assetValueAt(a, monthEnd), 0);
    result.push({ v: assetsSum + monthsCumulative, label: d.toLocaleString("de-DE", { month: "short" }) });
  }
  return result;
};

// Group entries by YYYY-MM and return per-month income/expense/balance, newest first.
// The current month (now) is flagged with isCurrent. Months with no entries are skipped.
export const computeMonthlyBalances = (entries) => {
  const groups = new Map();
  for (const e of entries || []) {
    const d = new Date(e.date);
    const y = d.getFullYear();
    const m = d.getMonth();
    const key = `${y}-${pad(m + 1)}`;
    let g = groups.get(key);
    if (!g) { g = { key, year: y, month: m, income: 0, expense: 0 }; groups.set(key, g); }
    if (e.type === "income") g.income += e.amount;
    else g.expense += e.amount;
  }
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth();
  return [...groups.values()]
    .map(g => ({ ...g, balance: g.income - g.expense, isCurrent: g.year === curY && g.month === curM }))
    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
};
