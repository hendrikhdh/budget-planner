import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Modal } from "../components/Modal.jsx";
import { SwipeToDelete } from "../components/SwipeToDelete.jsx";
import { ConfirmDialog } from "../components/layout/ConfirmDialog.jsx";
import { catName, catEmoji, sortCategoriesByUsage } from "../utils/categories.js";
import { uid, fmt, getToday } from "../utils/helpers.js";

export function RecurringPage({ data, setData, T, styles }) {
  const { inputStyle, selectStyle, labelStyle, btnPrimary, btnSecondary, chipStyle, glassCardStyle } = styles;
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const emptyForm = { type: "expense", category: "", amount: "", description: "", startMonth: String(getToday().month), startYear: String(getToday().year), cycle: "1", endMonth: "", endYear: "", hasEnd: false };
  const [form, setForm] = useState(emptyForm);
  const catsByType = (t) => {
    const base = t === "income" ? data.categories.income : data.categories.expense;
    return sortCategoriesByUsage(base, data.entries, t);
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (r) => {
    setEditId(r.id);
    setForm({ type: r.type, category: r.category, amount: String(r.amount), description: r.description, startMonth: String(r.startMonth), startYear: String(r.startYear), cycle: String(r.cycle), hasEnd: r.endYear != null, endMonth: r.endMonth != null ? String(r.endMonth) : "", endYear: r.endYear != null ? String(r.endYear) : "" });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };

  const saveRecurring = () => {
    if (!form.amount || !form.category) return;
    const parsed = { ...form, amount: parseFloat(form.amount), startMonth: parseInt(form.startMonth), startYear: parseInt(form.startYear), cycle: parseInt(form.cycle), endMonth: form.hasEnd && form.endMonth !== "" ? parseInt(form.endMonth) : null, endYear: form.hasEnd && form.endYear !== "" ? parseInt(form.endYear) : null };
    if (editId) {
      setData(prev => ({ ...prev, recurring: prev.recurring.map(r => r.id === editId ? { ...r, ...parsed } : r) }));
    } else {
      setData(prev => ({ ...prev, recurring: [...prev.recurring, { ...parsed, id: uid() }] }));
    }
    closeForm();
  };

  const deleteRecurring = (id) => {
    setData(prev => ({ ...prev, recurring: prev.recurring.filter(r => r.id !== id) }));
    if (editId === id) closeForm();
  };

  const cycles = [{ v: "1", l: "Monatlich" }, { v: "2", l: "Alle 2 Monate" }, { v: "3", l: "Vierteljährlich" }, { v: "6", l: "Halbjährlich" }, { v: "12", l: "Jährlich" }];
  const months = Array.from({ length: 12 }, (_, i) => ({ v: String(i), l: new Date(2024, i).toLocaleString("de-DE", { month: "long" }) }));

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Wiederkehrend</h2>
      {data.recurring.length === 0 && <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 32 }}>Keine wiederkehrenden Einträge</div>}

      <Modal open={showForm} onClose={closeForm} title={editId ? "Eintrag bearbeiten" : "Neuer Eintrag"} T={T}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setForm(f => ({ ...f, type: "expense", category: "" }))} style={chipStyle(form.type === "expense")}>Ausgabe</button>
          <button onClick={() => setForm(f => ({ ...f, type: "income", category: "" }))} style={chipStyle(form.type === "income")}>Einnahme</button>
        </div>
        <label style={labelStyle}>Kategorie</label>
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={selectStyle}>
          <option value="">Wählen...</option>
          {catsByType(form.type).map(c => <option key={catName(c)} value={catName(c)}>{catEmoji(c)} {catName(c)}</option>)}
        </select>
        <label style={labelStyle}>Betrag (€)</label>
        <input type="number" inputMode="decimal" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} placeholder="0.00"/>
        <label style={labelStyle}>Beschreibung</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} placeholder="z.B. Netflix Abo"/>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>Startmonat</label>
            <select value={form.startMonth} onChange={e => setForm(f => ({ ...f, startMonth: e.target.value }))} style={selectStyle}>
              {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select></div>
          <div style={{ flex: 1 }}><label style={labelStyle}>Startjahr</label>
            <input type="number" value={form.startYear} onChange={e => setForm(f => ({ ...f, startYear: e.target.value }))} style={inputStyle}/></div>
        </div>
        <label style={labelStyle}>Zyklus</label>
        <select value={form.cycle} onChange={e => setForm(f => ({ ...f, cycle: e.target.value }))} style={selectStyle}>
          {cycles.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
        </select>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.textSecondary, cursor: "pointer" }}>
            <input type="checkbox" checked={form.hasEnd} onChange={e => setForm(f => ({ ...f, hasEnd: e.target.checked }))} style={{ accentColor: T.accent }}/>
            Enddatum festlegen
          </label>
        </div>
        {form.hasEnd && (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>Endmonat</label>
              <select value={form.endMonth} onChange={e => setForm(f => ({ ...f, endMonth: e.target.value }))} style={selectStyle}>
                <option value="">Wählen...</option>
                {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Endjahr</label>
              <input type="number" value={form.endYear} onChange={e => setForm(f => ({ ...f, endYear: e.target.value }))} style={inputStyle} placeholder={String(getToday().year + 1)}/></div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={saveRecurring} style={btnPrimary}>{editId ? "Speichern" : "Hinzufügen"}</button>
        </div>
        {editId && (
          <button onClick={() => setPendingDelete({ id: editId })} style={{
            marginTop: 12, padding: "12px 18px", minHeight: 44, background: "none",
            border: `1px solid ${T.expense}40`, borderRadius: 10,
            color: T.expense, fontSize: 13, fontWeight: 600, cursor: "pointer",
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            <Icon name="trash" size={16} color={T.expense}/> Eintrag löschen
          </button>
        )}
      </Modal>

      {pendingDelete && (
        <ConfirmDialog T={T} styles={styles} danger
          title="Eintrag löschen?"
          text="Dieser wiederkehrende Eintrag wird dauerhaft gelöscht."
          confirmLabel="Löschen"
          onConfirm={() => { deleteRecurring(pendingDelete.id); setPendingDelete(null); }}
          onCancel={() => { if (pendingDelete.reset) pendingDelete.reset(); setPendingDelete(null); }}/>
      )}

      {[...data.recurring].sort((a, b) => {
        if (a.type !== b.type) return a.type === "income" ? -1 : 1;
        return b.amount - a.amount;
      }).map(r => {
        const cn = { 1: "Monatlich", 2: "Alle 2 Mo.", 3: "Vierteljährlich", 6: "Halbjährlich", 12: "Jährlich" }[r.cycle] || `Alle ${r.cycle} Mo.`;
        const endStr = r.endYear != null ? ` → ${new Date(r.endYear, r.endMonth || 0).toLocaleString("de-DE", { month: "short", year: "numeric" })}` : "";
        return (
          <SwipeToDelete key={r.id} onDelete={(reset) => setPendingDelete({ id: r.id, reset })} T={T}>
            <div onClick={() => openEdit(r)} style={{ ...glassCardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", cursor: "pointer", transition: "all .15s", borderRadius: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>{r.description || r.category}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{r.category} · {cn} · ab {new Date(r.startYear, r.startMonth).toLocaleString("de-DE", { month: "short", year: "numeric" })}{endStr}</div>
                </div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: r.type === "income" ? T.income : T.expense }}>{fmt(r.amount)}</span>
            </div>
          </SwipeToDelete>
        );
      })}
      <button onClick={openNew} aria-label="Neuer wiederkehrender Eintrag" style={{
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
