export const uid = () => crypto.randomUUID().replace(/-/g, "");

export const fmt = (n) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    n
  );

export const monthName = (m, y) =>
  new Date(y, m).toLocaleString("de-DE", { month: "long", year: "numeric" });

export const getToday = () => {
  const d = new Date();
  return { month: d.getMonth(), year: d.getFullYear(), day: d.getDate() };
};

export const pad = (n) => String(n).padStart(2, "0");

export const dateStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `Vor ${diffDays} Tagen`;
  return formatDate(dateString);
};
