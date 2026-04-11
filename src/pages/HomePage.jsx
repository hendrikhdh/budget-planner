import { useMemo, useRef } from "react";
import { fmt } from "../utils/helpers.js";
import { Icon } from "../components/Icon.jsx";
import { MonthNav } from "../components/MonthNav.jsx";
import { EntryItem } from "../components/EntryItem.jsx";
import { SwipeToDelete } from "../components/SwipeToDelete.jsx";

export function HomePage({
  data, T, styles, isDark,
  viewMonth, viewYear, prevMonth, nextMonth, goToday,
  monthEntries, income, expense, balance, balanceColor,
  openEdit, onDeleteEntry, emojiLookup, colorLookup,
  setPage, openNewEntry,
}) {
  const { btnSecondary, glassCardStyle } = styles;

  const entrySwipeActive = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const handlePageTouchStart = (ev) => { touchStartX.current = ev.touches[0].clientX; touchStartY.current = ev.touches[0].clientY; };
  const handlePageTouchEnd = (ev) => {
    if (entrySwipeActive.current) { entrySwipeActive.current = false; return; }
    const dx = ev.changedTouches[0].clientX - touchStartX.current;
    const dy = ev.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) prevMonth(); else nextMonth();
    }
  };

  const budgetWarnings = useMemo(() => {
    if (!data) return [];
    const budgets = data.budgets || {};
    return Object.entries(budgets).map(([cat, limit]) => {
      const spent = monthEntries.filter(e => e.type === "expense" && e.category === cat).reduce((s, e) => s + e.amount, 0);
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      return { cat, limit, spent, pct, remaining: limit - spent };
    }).filter(b => b.pct >= 75).sort((a, b) => b.pct - a.pct);
  }, [data && data.budgets, monthEntries]);

  return (
    <div style={{ padding: "0 16px 100px" }} onTouchStart={handlePageTouchStart} onTouchEnd={handlePageTouchEnd}>
      <MonthNav viewMonth={viewMonth} viewYear={viewYear} prevMonth={prevMonth} nextMonth={nextMonth} goToday={goToday} T={T} btnSecondary={btnSecondary}/>
      {/* Balance Card */}
      <div style={{
        background: isDark
          ? `linear-gradient(135deg, rgba(123,97,255,0.15), rgba(0,232,123,0.06))`
          : `linear-gradient(135deg, rgba(124,58,237,0.08), rgba(192,38,211,0.06), rgba(6,182,212,0.05))`,
        backdropFilter: T.glassBlur,
        border: `1px solid ${isDark ? 'rgba(123,97,255,0.25)' : 'rgba(255,255,255,0.7)'}`,
        borderRadius: 20, padding: "28px 24px", textAlign: "center",
        boxShadow: T.glassShadow,
        marginBottom: 20
      }}>
        <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Bilanz</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: balanceColor(balance), lineHeight: 1.2 }}>{fmt(balance)}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 20 }}>
          <div onClick={() => setPage("income-analysis")} style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 11, color: T.income, marginBottom: 2 }}>▲ Einnahmen →</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary }}>{fmt(income)}</div>
          </div>
          <div style={{ width: 1, background: `${T.textMuted}30` }}/>
          <div onClick={() => setPage("expense-analysis")} style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 11, color: T.expense, marginBottom: 2 }}>▼ Ausgaben →</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary }}>{fmt(expense)}</div>
          </div>
        </div>
      </div>
      {/* Savings Goals */}
      <div style={{ ...glassCardStyle, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="target" size={16} color={T.warning}/> Sparziele
          </div>
          <button onClick={() => setPage("savings")} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Verwalten →</button>
        </div>
        {data.savingsGoals.length === 0
          ? <div style={{ color: T.textMuted, fontSize: 13, padding: "8px 0" }}>Noch keine Sparziele definiert</div>
          : data.savingsGoals.map(g => {
            const pct = Math.min((g.saved / g.target) * 100, 100);
            return (
              <div key={g.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSecondary, marginBottom: 4 }}>
                  <span>{g.emoji && <span style={{ marginRight: 4 }}>{g.emoji}</span>}{g.name}</span>
                  <span>{fmt(g.saved)} / {fmt(g.target)}</span>
                </div>
                <div style={{ height: 6, background: `${T.textMuted}20`, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? T.income : `linear-gradient(90deg, ${T.accent}, #00f0ff)`, borderRadius: 3, transition: "width .5s" }}/>
                </div>
              </div>
            );
          })}
      </div>
      {/* Budget Warnings */}
      {budgetWarnings.length > 0 && (
        <div style={{ ...glassCardStyle, padding: "14px 16px", marginBottom: 16, border: `1px solid ${T.warning}30` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚠️</span> Budget-Warnungen
            </div>
            <button onClick={() => setPage("budget")} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Verwalten →</button>
          </div>
          {budgetWarnings.slice(0, 3).map(b => {
            const overBudget = b.remaining < 0;
            return (
              <div key={b.cat} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: T.textSecondary }}>{b.cat}</span>
                  <span style={{ color: overBudget ? T.expense : T.warning, fontWeight: 600 }}>
                    {overBudget ? `${fmt(Math.abs(b.remaining))} drüber` : `${fmt(b.remaining)} übrig`}
                  </span>
                </div>
                <div style={{ height: 4, background: `${T.textMuted}20`, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(b.pct, 100)}%`, background: overBudget ? T.expense : T.warning, borderRadius: 2 }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Recent Entries */}
      <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 12 }}>Letzte Einträge</div>
      {monthEntries.length === 0
        ? <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 24 }}>Keine Einträge in diesem Monat</div>
        : [...monthEntries].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map(e => (
          <SwipeToDelete key={e.id} onDelete={() => onDeleteEntry(e.id)} T={T} onSwipeActive={() => { entrySwipeActive.current = true; }}>
            <EntryItem e={e} onClick={() => openEdit(e)} emojiLookup={emojiLookup} colorLookup={colorLookup} T={T}/>
          </SwipeToDelete>
        ))}
      {/* FAB – Neuer Eintrag */}
      <button onClick={openNewEntry} aria-label="Neuer Eintrag" style={{
        position: "fixed",
        bottom: "calc(88px + env(safe-area-inset-bottom))",
        right: "calc(20px + env(safe-area-inset-right))",
        width: 60, height: 60,
        borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`,
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 20px ${T.accent}50`, zIndex: 200, color: "#fff",
        WebkitTapHighlightColor: "transparent"
      }}>
        <Icon name="plus" size={26}/>
      </button>
    </div>
  );
}
