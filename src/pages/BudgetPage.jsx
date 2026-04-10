import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Modal } from "../components/Modal.jsx";
import { SwipeToDelete } from "../components/SwipeToDelete.jsx";
import { catName, catEmoji } from "../utils/categories.js";
import { fmt } from "../utils/helpers.js";

export function BudgetPage({ data, setData, monthEntries, T, styles }) {
  const { inputStyle, labelStyle, btnPrimary, btnSecondary, glassCardStyle, chipStyle, selectStyle } = styles;
  const [newCat, setNewCat] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const budgets = data.budgets || {};
  const expenseCats = data.categories.expense || [];

  const addBudget = () => {
    if (!newCat || !newAmount) return;
    setData(prev => ({ ...prev, budgets: { ...prev.budgets, [newCat]: parseFloat(newAmount) } }));
    setNewCat(""); setNewAmount("");
    setShowForm(false);
  };
  const removeBudget = (cat) => {
    setData(prev => { const b = { ...prev.budgets }; delete b[cat]; return { ...prev, budgets: b }; });
  };
  const saveBudgetEdit = () => {
    if (!editCat || !editAmount) return;
    setData(prev => ({ ...prev, budgets: { ...prev.budgets, [editCat]: parseFloat(editAmount) || 0 } }));
    setEditCat(null);
  };
  const openEdit = (cat, limit) => { setEditCat(cat); setEditAmount(String(limit)); };
  const closeEdit = () => setEditCat(null);

  const catsWithBudget = Object.entries(budgets).map(([cat, limit]) => {
    const spent = monthEntries.filter(e => e.type === "expense" && e.category === cat).reduce((s, e) => s + e.amount, 0);
    const pct = limit > 0 ? Math.min((spent / limit) * 100, 150) : 0;
    return { cat, limit, spent, pct, remaining: limit - spent };
  }).sort((a, b) => b.pct - a.pct);

  const availableCats = expenseCats.filter(c => !budgets[catName(c)]);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Monatsbudgets</h2>
      {catsWithBudget.length === 0 && (
        <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 32 }}>
          {availableCats.length === 0 ? "Erstelle zuerst Ausgaben-Kategorien" : "Noch keine Budgets gesetzt – tippe auf + um zu beginnen"}
        </div>
      )}
      {catsWithBudget.map(({ cat, limit, spent, pct, remaining }) => {
        const overBudget = remaining < 0;
        const warn = pct >= 80 && pct < 100;
        const barColor = overBudget ? T.expense : warn ? T.warning : T.income;
        const emoji = (() => { const found = expenseCats.find(c => catName(c) === cat); return found ? catEmoji(found) : ""; })();
        return (
          <SwipeToDelete key={cat} onDelete={() => removeBudget(cat)} T={T}>
            <div onClick={() => openEdit(cat, limit)} style={{ ...glassCardStyle, padding: "14px 16px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{emoji && <span style={{ marginRight: 6 }}>{emoji}</span>}{cat}</span>
                <span style={{ fontSize: 12, color: T.textMuted }}>{pct.toFixed(0)}%</span>
              </div>
              <div style={{ height: 8, background: `${T.textMuted}20`, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 4, transition: "width .5s" }}/>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: T.textSecondary }}>{fmt(spent)} von {fmt(limit)}</span>
                <span style={{ color: overBudget ? T.expense : warn ? T.warning : T.income, fontWeight: 600 }}>
                  {overBudget ? `${fmt(Math.abs(remaining))} über Budget!` : `${fmt(remaining)} übrig`}
                </span>
              </div>
            </div>
          </SwipeToDelete>
        );
      })}

      <Modal open={!!editCat} onClose={closeEdit} title="Budget bearbeiten" T={T}>
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 4 }}>Kategorie</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 16 }}>
          {editCat && (() => { const found = expenseCats.find(c => catName(c) === editCat); return found ? `${catEmoji(found)} ${editCat}` : editCat; })()}
        </div>
        <label style={labelStyle}>Monatliches Limit (€)</label>
        <input type="number" inputMode="decimal" value={editAmount} onChange={e => setEditAmount(e.target.value)} style={inputStyle} autoFocus/>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={saveBudgetEdit} style={btnPrimary}>Speichern</button>
        </div>
        <button onClick={() => { if (window.confirm("Budget wirklich löschen?")) { removeBudget(editCat); closeEdit(); } }} style={{
          marginTop: 12, padding: "10px 18px", background: "none",
          border: `1px solid ${T.expense}40`, borderRadius: 10,
          color: T.expense, fontSize: 13, fontWeight: 600, cursor: "pointer",
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          <Icon name="trash" size={16} color={T.expense}/> Budget löschen
        </button>
      </Modal>

      <Modal open={showForm} onClose={() => { setShowForm(false); setNewCat(""); setNewAmount(""); }} title="Budget setzen" T={T}>
        {availableCats.length === 0 ? (
          <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: "16px 0" }}>Alle Kategorien haben bereits ein Budget.</div>
        ) : (
          <>
            <label style={labelStyle}>Kategorie</label>
            <select value={newCat} onChange={e => setNewCat(e.target.value)} style={selectStyle}>
              <option value="">Kategorie wählen...</option>
              {availableCats.map(c => <option key={catName(c)} value={catName(c)}>{catEmoji(c)} {catName(c)}</option>)}
            </select>
            <label style={labelStyle}>Monatliches Limit (€)</label>
            <input type="number" inputMode="decimal" value={newAmount} onChange={e => setNewAmount(e.target.value)} style={inputStyle} placeholder="0.00"/>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={addBudget} style={btnPrimary}>Budget setzen</button>
            </div>
          </>
        )}
      </Modal>

      <button onClick={() => setShowForm(true)} style={{
        position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
        borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`,
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 20px ${T.accent}50`, zIndex: 200, color: "#fff"
      }}>
        <Icon name="plus" size={24}/>
      </button>
    </div>
  );
}
