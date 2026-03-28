import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { fmt } from "../lib/utils";

export default function StatsPage() {
  const { data } = useApp();
  const entries = data?.entries || [];
  const categories = data?.categories;

  const now = new Date();

  // Current month stats
  const currentMonthEntries = useMemo(() => {
    return entries.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [entries]);

  const monthlyIncome = useMemo(() => {
    return currentMonthEntries
      .filter((e) => e.type === "income")
      .reduce((s, e) => s + e.amount, 0);
  }, [currentMonthEntries]);

  const monthlyExpense = useMemo(() => {
    return currentMonthEntries
      .filter((e) => e.type === "expense")
      .reduce((s, e) => s + e.amount, 0);
  }, [currentMonthEntries]);

  const monthlySavings = monthlyIncome - monthlyExpense;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const expenseCats = categories?.expense || [];
    const breakdown = expenseCats
      .map((cat) => {
        const amount = currentMonthEntries
          .filter((e) => e.type === "expense" && e.category === cat.name)
          .reduce((s, e) => s + e.amount, 0);
        return { ...cat, amount };
      })
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    return breakdown;
  }, [currentMonthEntries, categories]);

  const totalExpenseForPct = categoryBreakdown.reduce((s, c) => s + c.amount, 0) || 1;

  // Monthly comparison (last 6 months)
  const monthlyComparison = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthEntries = entries.filter((e) => {
        const ed = new Date(e.date);
        return ed.getMonth() === m && ed.getFullYear() === y;
      });
      const income = monthEntries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
      const expense = monthEntries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
      months.push({
        label: d.toLocaleString("de-DE", { month: "short" }),
        income,
        expense,
      });
    }
    return months;
  }, [entries]);

  const maxMonthly = Math.max(
    ...monthlyComparison.flatMap((m) => [m.income, m.expense]),
    1
  );

  const monthLabel = now.toLocaleString("de-DE", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <h1 className="font-headline font-extrabold text-3xl tracking-tight mb-2">
          Statistiken
        </h1>
        <p className="text-on-surface-variant text-sm">{monthLabel}</p>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-surface-lowest dark:bg-surface-low p-5 rounded-xl text-center dark:border dark:border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
            Einnahmen
          </p>
          <p className="font-headline font-bold text-lg text-income">
            {fmt(monthlyIncome)}
          </p>
        </div>
        <div className="bg-surface-lowest dark:bg-surface-low p-5 rounded-xl text-center dark:border dark:border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
            Ausgaben
          </p>
          <p className="font-headline font-bold text-lg text-expense">
            {fmt(monthlyExpense)}
          </p>
        </div>
        <div className="bg-surface-lowest dark:bg-surface-low p-5 rounded-xl text-center dark:border dark:border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
            Ersparnis
          </p>
          <p
            className={`font-headline font-bold text-lg ${
              monthlySavings >= 0 ? "text-income" : "text-expense"
            }`}
          >
            {fmt(monthlySavings)}
          </p>
        </div>
      </section>

      {/* Monthly Comparison Bar Chart */}
      <section className="bg-surface-lowest dark:bg-surface-low/60 dark:backdrop-blur-md rounded-xl p-8 shadow-[0_12px_32px_rgba(44,42,81,0.04)] dark:border dark:border-white/5">
        <h2 className="font-headline font-bold text-lg mb-6">
          Monatlicher Vergleich
        </h2>
        <div className="space-y-4">
          {monthlyComparison.map((m, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface-variant uppercase tracking-wider w-10">
                  {m.label}
                </span>
                <div className="flex gap-4 text-[10px]">
                  <span className="text-income font-semibold">
                    +{fmt(m.income)}
                  </span>
                  <span className="text-expense font-semibold">
                    -{fmt(m.expense)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 h-2">
                <div
                  className="bg-income/70 rounded-full transition-all duration-500"
                  style={{
                    width: `${(m.income / maxMonthly) * 100}%`,
                  }}
                />
                <div
                  className="bg-expense/70 rounded-full transition-all duration-500"
                  style={{
                    width: `${(m.expense / maxMonthly) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Breakdown */}
      <section className="bg-surface-lowest dark:bg-surface-low/60 rounded-xl p-8 shadow-[0_12px_32px_rgba(44,42,81,0.04)] dark:border dark:border-white/5">
        <h2 className="font-headline font-bold text-lg mb-6">
          Ausgaben nach Kategorie
        </h2>

        {categoryBreakdown.length > 0 ? (
          <div className="space-y-4">
            {categoryBreakdown.map((cat) => {
              const pct = Math.round((cat.amount / totalExpenseForPct) * 100);
              return (
                <div key={cat.name} className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${cat.color}15`,
                      color: cat.color,
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {cat.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-on-surface truncate">
                        {cat.name}
                      </span>
                      <span className="text-sm font-bold text-on-surface ml-2">
                        {fmt(cat.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-highest rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-on-surface-variant w-10 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-on-surface-variant text-sm text-center py-4">
            Keine Ausgaben in diesem Monat.
          </p>
        )}
      </section>
    </div>
  );
}
