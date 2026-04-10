import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Modal } from "../components/Modal.jsx";
import { SwipeToDelete } from "../components/SwipeToDelete.jsx";
import { uid, fmt } from "../utils/helpers.js";

export function SavingsPage({ data, setData, T, styles }) {
  const { inputStyle, labelStyle, btnPrimary, btnSecondary, glassCardStyle } = styles;
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const emptyForm = { name: "", target: "", saved: "0", emoji: "" };
  const [form, setForm] = useState(emptyForm);

  const openNew = () => { setEditId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (g) => {
    setEditId(g.id);
    setForm({ name: g.name, target: String(g.target), saved: String(g.saved), emoji: g.emoji || "" });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };

  const saveGoal = () => {
    if (!form.name || !form.target) return;
    if (editId) {
      setData(prev => ({ ...prev, savingsGoals: prev.savingsGoals.map(g => g.id === editId ? { ...g, name: form.name, target: parseFloat(form.target), saved: parseFloat(form.saved) || 0, emoji: form.emoji } : g) }));
    } else {
      setData(prev => ({ ...prev, savingsGoals: [...prev.savingsGoals, { id: uid(), name: form.name, target: parseFloat(form.target), saved: parseFloat(form.saved) || 0, emoji: form.emoji }] }));
    }
    closeForm();
  };

  const deleteGoal = (id) => {
    setData(prev => ({ ...prev, savingsGoals: prev.savingsGoals.filter(g => g.id !== id) }));
    if (editId === id) closeForm();
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Sparziele</h2>
      <Modal open={showForm} onClose={closeForm} title={editId ? "Sparziel bearbeiten" : "Neues Sparziel"} T={T}>
        <div style={{ display: "flex", gap: 8 }}>
          <div>
            <label style={labelStyle}>Emoji</label>
            <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} style={{ ...inputStyle, width: 52, textAlign: "center", fontSize: 22, padding: "6px" }} placeholder="🎯"/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="z.B. Urlaub 2026"/>
          </div>
        </div>
        <label style={labelStyle}>Zielbetrag (€)</label>
        <input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} style={inputStyle} placeholder="5000"/>
        <label style={labelStyle}>Bereits gespart (€)</label>
        <input type="number" value={form.saved} onChange={e => setForm(f => ({ ...f, saved: e.target.value }))} style={inputStyle} placeholder="0"/>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={saveGoal} style={btnPrimary}>{editId ? "Speichern" : "Hinzufügen"}</button>
        </div>
        {editId && (
          <button onClick={() => { if (window.confirm("Dieses Sparziel wirklich löschen?")) { deleteGoal(editId); closeForm(); } }} style={{
            marginTop: 12, padding: "10px 18px", background: "none",
            border: `1px solid ${T.expense}40`, borderRadius: 10,
            color: T.expense, fontSize: 13, fontWeight: 600, cursor: "pointer",
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            <Icon name="trash" size={16} color={T.expense}/> Sparziel löschen
          </button>
        )}
      </Modal>
      {data.savingsGoals.length === 0 && !showForm && <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 32 }}>Noch keine Sparziele</div>}
      {data.savingsGoals.map(g => {
        const pct = Math.min((g.saved / g.target) * 100, 100);
        const isEditing = editId === g.id && showForm;
        return (
          <SwipeToDelete key={g.id} onDelete={() => deleteGoal(g.id)} T={T}>
            <div onClick={() => openEdit(g)} style={{ ...glassCardStyle, padding: "16px 18px", cursor: "pointer", border: isEditing ? `1px solid ${T.accent}50` : glassCardStyle.border, transition: "all .15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: T.textPrimary, fontSize: 15, fontWeight: 700 }}>{g.emoji && <span style={{ marginRight: 6 }}>{g.emoji}</span>}{g.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSecondary, marginBottom: 6 }}><span>{fmt(g.saved)} gespart</span><span>{pct.toFixed(0)}% von {fmt(g.target)}</span></div>
              <div style={{ height: 8, background: `${T.textMuted}20`, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? T.income : `linear-gradient(90deg, ${T.accent}, #00f0ff)`, borderRadius: 4, transition: "width .5s" }}/>
              </div>
              {pct >= 100 && <div style={{ marginTop: 6, fontSize: 12, color: T.income, fontWeight: 600 }}>✓ Ziel erreicht!</div>}
            </div>
          </SwipeToDelete>
        );
      })}
      <button onClick={openNew} style={{
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
