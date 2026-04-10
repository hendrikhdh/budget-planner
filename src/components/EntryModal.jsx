import { useState, useEffect } from "react";
import { Modal } from "./Modal.jsx";
import { Icon } from "./Icon.jsx";
import { catName, catEmoji } from "../utils/categories.js";
import { dateStr, getToday } from "../utils/helpers.js";

export function EntryModal({ open, onClose, editEntry, onSave, onDelete, categories, viewMonth, viewYear, T, styles }) {
  const { inputStyle, selectStyle, labelStyle, btnPrimary, btnSecondary, chipStyle } = styles;
  const isEdit = !!editEntry;
  const [form, setForm] = useState({ type: "expense", category: "", amount: "", description: "", date: dateStr(viewYear, viewMonth, getToday().day) });
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (editEntry) setForm({ type: editEntry.type, category: editEntry.category, amount: String(editEntry.amount), description: editEntry.description, date: editEntry.date });
    else setForm({ type: "expense", category: "", amount: "", description: "", date: dateStr(viewYear, viewMonth, getToday().day) });
    setErrors({});
  }, [editEntry, open, viewMonth, viewYear]);
  const catsByType = (t) => t === "income" ? categories.income : categories.expense;
  const errorStyle = { fontSize: 11, color: T.expense, marginTop: 4, marginBottom: 4 };
  const inputErr = (field) => ({ ...inputStyle, borderColor: errors[field] ? T.expense : inputStyle.borderColor });
  const selectErr = (field) => ({ ...selectStyle, borderColor: errors[field] ? T.expense : selectStyle.borderColor });
  const save = () => {
    const errs = {};
    if (!form.category) errs.category = "Bitte eine Kategorie auswählen.";
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = "Bitte einen gültigen Betrag größer als 0 eingeben.";
    else if (amt > 1_000_000) errs.amount = "Betrag darf 1.000.000 € nicht überschreiten.";
    if (!form.date) errs.date = "Bitte ein Datum auswählen.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onSave({ ...(editEntry || {}), ...form, amount: amt });
  };
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Eintrag bearbeiten" : "Neuer Eintrag"} T={T}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setForm(f => ({ ...f, type: "expense", category: "" }))} style={chipStyle(form.type === "expense")}>Ausgabe</button>
        <button onClick={() => setForm(f => ({ ...f, type: "income", category: "" }))} style={chipStyle(form.type === "income")}>Einnahme</button>
      </div>
      <label style={labelStyle}>Kategorie</label>
      <select value={form.category} onChange={e => { setForm(f => ({ ...f, category: e.target.value })); setErrors(er => ({ ...er, category: null })); }} style={selectErr("category")}>
        <option value="">Kategorie wählen...</option>
        {catsByType(form.type).map(c => <option key={catName(c)} value={catName(c)}>{catEmoji(c)} {catName(c)}</option>)}
      </select>
      {errors.category && <div style={errorStyle}>⚠ {errors.category}</div>}
      <label style={labelStyle}>Betrag (€)</label>
      <input type="number" inputMode="decimal" value={form.amount} onChange={e => { setForm(f => ({ ...f, amount: e.target.value })); setErrors(er => ({ ...er, amount: null })); }} style={inputErr("amount")} placeholder="0.00"/>
      {errors.amount && <div style={errorStyle}>⚠ {errors.amount}</div>}
      <label style={labelStyle}>Beschreibung</label>
      <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} placeholder="Wofür?"/>
      <label style={labelStyle}>Datum</label>
      <input type="date" value={form.date} onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(er => ({ ...er, date: null })); }} style={{ ...inputErr("date"), display: "block", WebkitAppearance: "none", appearance: "none", minWidth: 0 }}/>
      {errors.date && <div style={errorStyle}>⚠ {errors.date}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button onClick={save} style={btnPrimary}>{isEdit ? "Speichern" : "Hinzufügen"}</button>
      </div>
      {isEdit && (
        <button onClick={() => { if (window.confirm("Diesen Eintrag wirklich löschen?")) onDelete(editEntry.id); }} style={{
          marginTop: 12, padding: "10px 18px", background: "none",
          border: `1px solid ${T.expense}40`, borderRadius: 10,
          color: T.expense, fontSize: 13, fontWeight: 600, cursor: "pointer",
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all .2s"
        }}>
          <Icon name="trash" size={16} color={T.expense}/> Eintrag löschen
        </button>
      )}
    </Modal>
  );
}
