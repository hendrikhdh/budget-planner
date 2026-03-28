import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { fmt } from "../lib/utils";
import TransactionItem from "../components/shared/TransactionItem";
import CategoryPill from "../components/shared/CategoryPill";

export default function HistoryPage() {
  const { data } = useApp();
  const entries = data?.entries || [];
  const categories = data?.categories;
  const budgets = data?.budgets || {};
  const [filter, setFilter] = useState("all");

  // Total balance
  const totalBalance = useMemo(() => {
    return entries.reduce((sum, e) => {
      return e.type === "income" ? sum + e.amount : sum - e.amount;
    }, 0);
  }, [entries]);

  // Current month spending + limit
  const now = new Date();
  const currentMonthExpenses = useMemo(() => {
    return entries
      .filter((e) => {
        const d = new Date(e.date);
        return (
          e.type === "expense" &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [entries]);

  // Total monthly budget limit
  const monthlyLimit = useMemo(() => {
    return Object.values(budgets).reduce((sum, v) => sum + (v || 0), 0);
  }, [budgets]);

  const limitPct = monthlyLimit > 0 ? Math.min((currentMonthExpenses / monthlyLimit) * 100, 100) : 0;

  // Trend vs last month
  const lastMonthBalance = useMemo(() => {
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return entries
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
      })
      .reduce((sum, e) => (e.type === "income" ? sum + e.amount : sum - e.amount), 0);
  }, [entries]);

  const trendPct = lastMonthBalance !== 0
    ? ((totalBalance - lastMonthBalance) / Math.abs(lastMonthBalance) * 100).toFixed(1)
    : 0;

  // Unique expense categories for filter
  const expenseCats = useMemo(() => {
    const cats = categories?.expense || [];
    return cats.map((c) => c.name);
  }, [categories]);

  // Filtered and sorted entries
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];
    if (filter !== "all") {
      filtered = filtered.filter((e) => e.category === filter);
    }
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [entries, filter]);

  return (
    <div className="space-y-8">
      {/* Balance Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Balance */}
        <div className="bg-surface-lowest dark:bg-surface-low p-8 rounded-xl shadow-[0_12px_32px_rgba(44,42,81,0.04)] relative overflow-hidden group">
          <div className="relative z-10">
            <p className="font-label text-sm font-medium text-on-surface-variant mb-1 uppercase tracking-widest">
              Gesamtbilanz
            </p>
            <h2 className="font-headline font-extrabold text-4xl tracking-tight mb-4">
              {fmt(totalBalance)}
            </h2>
            <div className="flex items-center gap-2 text-tertiary font-semibold">
              <span className="material-symbols-outlined text-sm">
                {parseFloat(trendPct) >= 0 ? "trending_up" : "trending_down"}
              </span>
              <span className="text-sm">
                {parseFloat(trendPct) >= 0 ? "+" : ""}{trendPct}% diesen Monat
              </span>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
        </div>

        {/* Monthly Limit */}
        <div className="bg-secondary-container/30 dark:bg-secondary-container/10 p-8 rounded-xl border border-outline-variant/10">
          <p className="font-label text-sm font-medium text-on-surface-variant mb-1 uppercase tracking-widest">
            Monatslimit
          </p>
          <div className="flex justify-between items-end mb-4">
            <h2 className="font-headline font-bold text-2xl tracking-tight">
              {monthlyLimit > 0 ? fmt(monthlyLimit) : "Nicht gesetzt"}
            </h2>
            {monthlyLimit > 0 && (
              <span className="text-sm font-medium text-on-surface-variant">
                {Math.round(limitPct)}% verbraucht
              </span>
            )}
          </div>
          {monthlyLimit > 0 && (
            <div className="h-3 w-full bg-surface-lowest dark:bg-surface-highest rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  limitPct > 90 ? "bg-expense" : "bg-secondary"
                }`}
                style={{ width: `${limitPct}%` }}
              />
            </div>
          )}
        </div>
      </section>

      {/* Category Filter */}
      <section className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <CategoryPill
          label="Alle"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {expenseCats.map((cat) => (
          <CategoryPill
            key={cat}
            label={cat}
            active={filter === cat}
            onClick={() => setFilter(cat)}
          />
        ))}
      </section>

      {/* Transaction List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-headline font-bold text-xl text-on-surface">
            Aktivität
          </h3>
          <span className="text-on-surface-variant text-sm">
            {filteredEntries.length} Einträge
          </span>
        </div>

        {filteredEntries.length > 0 ? (
          <div className="space-y-2">
            {filteredEntries.map((entry) => (
              <TransactionItem
                key={entry.id}
                entry={entry}
                categories={categories}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface-lowest dark:bg-surface-low rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
              search_off
            </span>
            <p className="text-on-surface-variant text-sm">
              Keine Transaktionen gefunden.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
