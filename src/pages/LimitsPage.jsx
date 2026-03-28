import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { fmt } from "../lib/utils";
import ProgressBar from "../components/shared/ProgressBar";

export default function LimitsPage() {
  const { data, setData } = useApp();
  const budgets = data?.budgets || {};
  const entries = data?.entries || [];
  const expenseCats = data?.categories?.expense || [];
  const [editCat, setEditCat] = useState(null);
  const [editValue, setEditValue] = useState("");

  const now = new Date();
  const currentMonthEntries = useMemo(() => {
    return entries.filter((e) => {
      const d = new Date(e.date);
      return (
        e.type === "expense" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });
  }, [entries]);

  const totalLimit = Object.values(budgets).reduce((s, v) => s + (v || 0), 0);
  const totalSpent = currentMonthEntries.reduce((s, e) => s + e.amount, 0);

  const catData = useMemo(() => {
    return expenseCats.map((cat) => {
      const spent = currentMonthEntries
        .filter((e) => e.category === cat.name)
        .reduce((s, e) => s + e.amount, 0);
      const limit = budgets[cat.name] || 0;
      return { ...cat, spent, limit };
    });
  }, [expenseCats, currentMonthEntries, budgets]);

  const handleSave = (catName) => {
    const val = parseFloat(editValue);
    setData((prev) => ({
      ...prev,
      budgets: {
        ...prev.budgets,
        [catName]: isNaN(val) || val < 0 ? 0 : val,
      },
    }));
    setEditCat(null);
    setEditValue("");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <h1 className="font-headline font-extrabold text-3xl tracking-tight mb-2">
          Budget Limits
        </h1>
        <p className="text-on-surface-variant text-sm">
          Setze monatliche Limits pro Kategorie
        </p>
      </section>

      {/* Total Overview */}
      <section className="bg-surface-lowest dark:bg-surface-low p-6 rounded-xl shadow-[0_12px_32px_rgba(44,42,81,0.04)] dark:border dark:border-white/5">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-on-surface-variant text-xs uppercase tracking-widest font-medium mb-1">
              Gesamtbudget
            </p>
            <p className="font-headline font-bold text-2xl">
              {totalLimit > 0 ? fmt(totalLimit) : "Nicht gesetzt"}
            </p>
          </div>
          {totalLimit > 0 && (
            <div className="text-right">
              <p className="font-headline font-bold text-lg text-on-surface">
                {fmt(totalSpent)}
              </p>
              <p className="text-on-surface-variant text-xs">ausgegeben</p>
            </div>
          )}
        </div>
        {totalLimit > 0 && (
          <ProgressBar
            value={totalSpent}
            max={totalLimit}
            color={
              totalSpent / totalLimit > 0.9
                ? "bg-expense"
                : totalSpent / totalLimit > 0.7
                  ? "bg-secondary"
                  : "bg-primary"
            }
          />
        )}
      </section>

      {/* Category List */}
      <section className="space-y-3">
        {catData.map((cat) => {
          const isEditing = editCat === cat.name;
          const pct = cat.limit > 0 ? Math.round((cat.spent / cat.limit) * 100) : 0;

          return (
            <div
              key={cat.name}
              className="bg-surface-lowest dark:bg-surface-low p-5 rounded-xl dark:border dark:border-white/5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {cat.icon}
                    </span>
                  </div>
                  <div>
                    <p className="font-body font-semibold text-on-surface">
                      {cat.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {cat.limit > 0
                        ? `${fmt(cat.spent)} / ${fmt(cat.limit)} (${pct}%)`
                        : "Kein Limit"}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="0"
                      className="w-24 px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-on-surface text-sm outline-none focus:border-primary"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleSave(cat.name)}
                    />
                    <button
                      onClick={() => handleSave(cat.name)}
                      className="p-2 rounded-lg bg-primary text-on-primary"
                    >
                      <span className="material-symbols-outlined text-sm">
                        check
                      </span>
                    </button>
                    <button
                      onClick={() => { setEditCat(null); setEditValue(""); }}
                      className="p-2 rounded-lg bg-surface-container text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-sm">
                        close
                      </span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditCat(cat.name);
                      setEditValue(cat.limit > 0 ? String(cat.limit) : "");
                    }}
                    className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      edit
                    </span>
                  </button>
                )}
              </div>

              {cat.limit > 0 && (
                <ProgressBar
                  value={cat.spent}
                  max={cat.limit}
                  color={
                    pct > 90
                      ? "bg-expense"
                      : pct > 70
                        ? "bg-secondary"
                        : "bg-primary"
                  }
                />
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
