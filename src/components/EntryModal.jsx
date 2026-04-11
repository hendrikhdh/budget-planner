import { useState, useEffect } from "react";
import { Modal } from "./Modal.jsx";
import { Icon } from "./Icon.jsx";
import { ConfirmDialog } from "./layout/ConfirmDialog.jsx";
import { catName, catEmoji, sortCategoriesByUsage } from "../utils/categories.js";
import { dateStr, getToday } from "../utils/helpers.js";

const SAVINGS_CATEGORY = "Sparziele";

export function EntryModal({ open, onClose, editEntry, onSave, onDelete, categories, entries, savingsGoals, setPage, viewMonth, viewYear, T, styles }) {
  const { inputStyle, selectStyle, labelStyle, btnPrimary, chipStyle } = styles;
  const isEdit = !!editEntry;
  const emptyForm = () => ({ type: "expense", category: "", savingsGoalId: "", amount: "", description: "", date: dateStr(viewYear, viewMonth, getToday().day) });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (editEntry) {
      const isGoal = !!editEntry.savingsGoalId;
      setForm({
        type: isGoal ? "goal" : editEntry.type,
        category: editEntry.category,
        savingsGoalId: editEntry.savingsGoalId || "",
        amount: String(editEntry.amount),
        description: editEntry.description,
        date: editEntry.date
      });
    } else setForm(emptyForm());
    setErrors({});
    setConfirmDelete(false);
  }, [editEntry, open, viewMonth, viewYear]);

  const catsByType = (t) => {
    const base = t === "income" ? categories.income : categories.expense;
    return sortCategoriesByUsage(base, entries, t);
  };
  const errorStyle = { fontSize: 11, color: T.expense, marginTop: 4, marginBottom: 4 };
  const inputErr = (field) => ({ ...inputStyle, borderColor: errors[field] ? T.expense : inputStyle.borderColor });
  const selectErr = (field) => ({ ...selectStyle, borderColor: errors[field] ? T.expense : selectStyle.borderColor });

  const setType = (t) => setForm(f => ({ ...f, type: t, category: "", savingsGoalId: "" }));

  const save = () => {
    const errs = {};
    const isGoal = form.type === "goal";
    if (isGoal) {
      if (!form.savingsGoalId) errs.category = "Bitte ein Sparziel auswählen.";
    } else if (!form.category) {
      errs.category = "Bitte eine Kategorie auswählen.";
    }
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = "Bitte einen gültigen Betrag größer als 0 eingeben.";
    else if (amt > 1_000_000) errs.amount = "Betrag darf 1.000.000 € nicht überschreiten.";
    if (!form.date) errs.date = "Bitte ein Datum auswählen.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const base = { ...(editEntry || {}), amount: amt, description: form.description, date: form.date };
    const payload = isGoal
      ? { ...base, type: "expense", category: SAVINGS_CATEGORY, savingsGoalId: form.savingsGoalId }
      : { ...base, type: form.type, category: form.category, savingsGoalId: undefined };
    onSave(payload);
  };

  const goals = savingsGoals || [];
  const goalGate = form.type === "goal" && goals.length === 0;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Eintrag bearbeiten" : "Neuer Eintrag"} T={T}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setType("expense")} style={chipStyle(form.type === "expense")}>Ausgabe</button>
        <button onClick={() => setType("income")} style={chipStyle(form.type === "income")}>Einnahme</button>
        <button onClick={() => setType("goal")} style={chipStyle(form.type === "goal")}>Ziel</button>
      </div>

      {form.type === "goal" ? (
        <>
          <label style={labelStyle}>Sparziel</label>
          {goalGate ? (
            <div style={{
              padding: "12px 14px", borderRadius: 10, background: `${T.warning}15`,
              border: `1px solid ${T.warning}40`, fontSize: 12, color: T.textSecondary, lineHeight: 1.5
            }}>
              Noch keine Sparziele vorhanden.{" "}
              {setPage && (
                <button onClick={() => { onClose && onClose(); setPage("savings"); }} style={{
                  background: "none", border: "none", color: T.accent, fontWeight: 700,
                  cursor: "pointer", padding: 0, fontSize: 12, textDecoration: "underline"
                }}>Jetzt Sparziel anlegen</button>
              )}
            </div>
          ) : (
            <select value={form.savingsGoalId} onChange={e => { setForm(f => ({ ...f, savingsGoalId: e.target.value })); setErrors(er => ({ ...er, category: null })); }} style={selectErr("category")}>
              <option value="">Sparziel wählen...</option>
              {goals.map(g => <option key={g.id} value={g.id}>{g.emoji || "🎯"} {g.name}</option>)}
            </select>
          )}
        </>
      ) : (
        <>
          <label style={labelStyle}>Kategorie</label>
          <select value={form.category} onChange={e => { setForm(f => ({ ...f, category: e.target.value })); setErrors(er => ({ ...er, category: null })); }} style={selectErr("category")}>
            <option value="">Kategorie wählen...</option>
            {catsByType(form.type).map(c => <option key={catName(c)} value={catName(c)}>{catEmoji(c)} {catName(c)}</option>)}
          </select>
        </>
      )}
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
        <button onClick={save} disabled={goalGate} style={{ ...btnPrimary, opacity: goalGate ? 0.5 : 1, cursor: goalGate ? "not-allowed" : "pointer" }}>{isEdit ? "Speichern" : "Hinzufügen"}</button>
      </div>
      {isEdit && (
        <button onClick={() => setConfirmDelete(true)} style={{
          marginTop: 12, padding: "12px 18px", minHeight: 44, background: "none",
          border: `1px solid ${T.expense}40`, borderRadius: 10,
          color: T.expense, fontSize: 13, fontWeight: 600, cursor: "pointer",
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all .2s"
        }}>
          <Icon name="trash" size={16} color={T.expense}/> Eintrag löschen
        </button>
      )}
      {confirmDelete && (
        <ConfirmDialog T={T} styles={styles} danger
          title="Eintrag löschen?"
          text="Dieser Eintrag wird dauerhaft gelöscht."
          confirmLabel="Löschen"
          onConfirm={() => { setConfirmDelete(false); onDelete(editEntry.id); }}
          onCancel={() => setConfirmDelete(false)}/>
      )}
    </Modal>
  );
}
