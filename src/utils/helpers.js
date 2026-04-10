export const uid = () => crypto.randomUUID().replace(/-/g, "");
export const fmt = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
export const fmtWhole = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
export const fmtShort = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : Math.round(n).toString();
export const monthName = (m, y) => new Date(y, m).toLocaleString("de-DE", { month: "long", year: "numeric" });
export const getToday = () => { const d = new Date(); return { month: d.getMonth(), year: d.getFullYear(), day: d.getDate() }; };
export const pad = (n) => String(n).padStart(2, "0");
export const dateStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
