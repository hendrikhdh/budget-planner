import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { fmt } from "../lib/utils";
import BarChart from "../components/charts/BarChart";
import ProgressBar from "../components/shared/ProgressBar";
import TransactionItem from "../components/shared/TransactionItem";

export default function DashboardPage() {
  const { data } = useApp();
  const entries = data?.entries || [];
  const budgets = data?.budgets || {};
  const categories = data?.categories;

  // Calculate total balance
  const totalBalance = useMemo(() => {
    return entries.reduce((sum, e) => {
      return e.type === "income" ? sum + e.amount : sum - e.amount;
    }, 0);
  }, [entries]);

  // Current month entries
  const now = new Date();
  const currentMonthEntries = useMemo(() => {
    return entries.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [entries]);

  // Monthly spending
  const monthlySpending = useMemo(() => {
    return currentMonthEntries
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [currentMonthEntries]);

  // Monthly income
  const monthlyIncome = useMemo(() => {
    return currentMonthEntries
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [currentMonthEntries]);

  // Trend calculation (vs last month)
  const lastMonthBalance = useMemo(() => {
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const lastEntries = entries.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
    });
    const income = lastEntries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const expense = lastEntries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return income - expense;
  }, [entries]);

  const trendPct = lastMonthBalance !== 0
    ? (((monthlyIncome - monthlySpending - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100).toFixed(1)
    : 0;

  // Weekly spending data for bar chart
  const weeklyData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayStr = d.toISOString().split("T")[0];
      const dayExpenses = entries
        .filter((e) => e.type === "expense" && e.date === dayStr)
        .reduce((sum, e) => sum + e.amount, 0);
      return { day: d, amount: dayExpenses };
    });
    return days;
  }, [entries]);

  const weeklyTotal = weeklyData.reduce((s, d) => s + d.amount, 0);

  // Active budgets
  const activeBudgets = useMemo(() => {
    const expenseCats = data?.categories?.expense || [];
    return expenseCats
      .filter((cat) => budgets[cat.name] && budgets[cat.name] > 0)
      .map((cat) => {
        const spent = currentMonthEntries
          .filter((e) => e.type === "expense" && e.category === cat.name)
          .reduce((s, e) => s + e.amount, 0);
        return { ...cat, spent, limit: budgets[cat.name] };
      })
      .slice(0, 3);
  }, [currentMonthEntries, budgets, data?.categories?.expense]);

  // Recent transactions (last 3)
  const recentEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  }, [entries]);

  return (
    <div className="space-y-8">
      {/* Hero: Portfolio Balance */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary p-8 text-on-primary shadow-xl">
        <div className="relative z-10">
          <p className="font-label text-sm uppercase tracking-widest opacity-80 mb-2">
            Gesamtbilanz
          </p>
          <h1 className="font-headline text-5xl font-extrabold tracking-tight mb-6">
            {fmt(totalBalance)}
          </h1>
          <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
            <span className="material-symbols-outlined text-sm">
              {parseFloat(trendPct) >= 0 ? "trending_up" : "trending_down"}
            </span>
            <span className="text-xs font-semibold">
              {parseFloat(trendPct) >= 0 ? "+" : ""}
              {trendPct}% diesen Monat
            </span>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Weekly Spending Chart */}
        <section className="md:col-span-8 bg-surface-lowest dark:bg-surface-low/60 dark:backdrop-blur-md rounded-xl p-8 shadow-[0_12px_32px_rgba(44,42,81,0.04)] dark:border dark:border-white/5">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface">
                Wochenausgaben
              </h2>
              <p className="text-on-surface-variant text-sm">
                Aktuelle Woche im Überblick
              </p>
            </div>
            <div className="text-right">
              <span className="block text-2xl font-bold text-primary">
                {fmt(weeklyTotal)}
              </span>
            </div>
          </div>
          <BarChart data={weeklyData} />
        </section>

        {/* Active Budgets */}
        <section className="md:col-span-4 bg-surface-low dark:bg-surface-container rounded-xl p-8 flex flex-col justify-between dark:border dark:border-white/5">
          <div>
            <h2 className="font-headline text-xl font-bold mb-6">
              Aktive Budgets
            </h2>
            {activeBudgets.length > 0 ? (
              <div className="space-y-6">
                {activeBudgets.map((b) => {
                  const pct = Math.round((b.spent / b.limit) * 100);
                  return (
                    <ProgressBar
                      key={b.name}
                      value={b.spent}
                      max={b.limit}
                      label={b.name}
                      sublabel={`${pct}%`}
                      color={
                        pct > 90
                          ? "bg-expense"
                          : pct > 70
                            ? "bg-secondary"
                            : "bg-primary"
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-on-surface-variant text-sm">
                Keine Budgets gesetzt. Gehe zu "Limits" um Budgets festzulegen.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Recent Activity */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-headline text-xl font-bold">
            Letzte Aktivität
          </h2>
        </div>

        {recentEntries.length > 0 ? (
          <div className="space-y-2">
            {recentEntries.map((entry) => (
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
              receipt_long
            </span>
            <p className="text-on-surface-variant text-sm">
              Noch keine Transaktionen. Tippe auf + um eine hinzuzufügen.
            </p>
          </div>
        )}
      </section>

      {/* Insight Card */}
      {monthlySpending > 0 && (
        <section className="bg-surface-high dark:bg-gradient-to-br dark:from-surface-container dark:to-surface-high rounded-xl p-8 relative overflow-hidden dark:border dark:border-outline-variant/10">
          <div className="relative z-10">
            <p className="text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
              Analyse
            </p>
            <h3 className="font-headline font-bold text-xl leading-tight mb-2 text-on-surface">
              {monthlyIncome > monthlySpending
                ? `Du sparst diesen Monat ${fmt(monthlyIncome - monthlySpending)}.`
                : `Deine Ausgaben übersteigen die Einnahmen um ${fmt(monthlySpending - monthlyIncome)}.`}
            </h3>
            <p className="text-on-surface-variant text-sm">
              {monthlyIncome > monthlySpending
                ? "Weiter so! Du bist auf einem guten Weg."
                : "Überprüfe deine Ausgaben um dein Budget einzuhalten."}
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span
              className="material-symbols-outlined text-8xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              insights
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
