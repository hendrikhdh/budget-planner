import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Modal } from "../components/Modal.jsx";
import { SwipeToDelete } from "../components/SwipeToDelete.jsx";
import { ConfirmDialog } from "../components/layout/ConfirmDialog.jsx";
import { catName, catEmoji, sortCategoriesByUsage } from "../utils/categories.js";
import { uid, fmt, getToday } from "../utils/helpers.js";

// Frühestes plausibles Startjahr. Ohne Grenze erzeugte ein Tippfehler wie
// "202" tausende Buchungen rückwirkend.
const MIN_YEAR = 2000;

export function RecurringPage({ data, setData, T, styles }) {
  const { inputStyle, selectStyle, labelStyle, btnPrimary, chipStyle, glassCardStyle } = styles;
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const emptyForm = { type: "expense", category: "", amount: "", description: "", startMonth: String(getToday().month), startYear: String(getToday().year), cycle: "1", endMonth: "", endYear: "", hasEnd: false };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const catsByType = (t) => {
    const base = t === "income" ? data.categories.income : data.categories.expense;
    return sortCategoriesByUsage(base, data.entries, t);
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setErrors({}); setShowForm(true); };
  const openEdit = (r) => {
    setEditId(r.id);
    setForm({ type: r.type, category: r.category, amount: String(r.amount), description: r.description, startMonth: String(r.startMonth), startYear: String(r.startYear), cycle: String(r.cycle), hasEnd: r.endYear != null, endMonth: r.endMonth != null ? String(r.endMonth) : "", endYear: r.endYear != null ? String(r.endYear) : "" });
    setErrors({});
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); setErrors({}); };

  const saveRecurring = () => {
    const errs = {};
    if (!form.category) errs.category = "Bitte eine Kategorie auswählen.";
    const amount = parseFloat(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) errs.amount = "Bitte einen Betrag größer als 0 eingeben.";
    else if (amount > 1_000_000) errs.amount = "Betrag darf 1.000.000 € nicht überschreiten.";

    const startYear = parseInt(form.startYear, 10);
    const startMonth = parseInt(form.startMonth, 10);
    const maxYear = getToday().year + 5;
    if (!Number.isInteger(startYear) || startYear < MIN_YEAR || startYear > maxYear) {
      errs.start = `Startjahr muss zwischen ${MIN_YEAR} und ${maxYear} liegen.`;
    }

    // Beide Endfelder gemeinsam: nur der Endmonat gesetzt hieß bisher "läuft
    // ewig", nur das Endjahr gesetzt hieß "endet im Januar" — beides ungewollt.
    let endYear = null, endMonth = null;
    if (form.hasEnd) {
      endYear = parseInt(form.endYear, 10);
      endMonth = parseInt(form.endMonth, 10);
      if (!Number.isInteger(endYear) || !Number.isInteger(endMonth)) {
        errs.end = "Bitte Endmonat und Endjahr angeben.";
      } else if (endYear > maxYear) {
        errs.end = `Endjahr darf höchstens ${maxYear} sein.`;
      } else if (Number.isInteger(startYear) && (endYear < startYear || (endYear === startYear && endMonth < startMonth))) {
        errs.end = "Das Ende darf nicht vor dem Start liegen.";
      }
    }

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const parsed = {
      type: form.type,
      category: form.category,
      amount,
      description: form.description,
      startMonth, startYear,
      cycle: parseInt(form.cycle, 10) || 1,
      endMonth: form.hasEnd ? endMonth : null,
      endYear: form.hasEnd ? endYear : null,
    };
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

  const errorStyle = { fontSize: 11, color: T.expense, marginTop: 4, lineHeight: 1.5 };
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
        {errors.category && <div style={errorStyle}>⚠ {errors.category}</div>}
        <label style={labelStyle}>Betrag (€)</label>
        <input type="number" inputMode="decimal" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} placeholder="0.00"/>
        {errors.amount && <div style={errorStyle}>⚠ {errors.amount}</div>}
        <label style={labelStyle}>Beschreibung</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} placeholder="z.B. Netflix Abo"/>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>Startmonat</label>
            <select value={form.startMonth} onChange={e => setForm(f => ({ ...f, startMonth: e.target.value }))} style={selectStyle}>
              {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select></div>
          <div style={{ flex: 1 }}><label style={labelStyle}>Startjahr</label>
            <input type="number" inputMode="numeric" min={MIN_YEAR} max={getToday().year + 5}
              value={form.startYear} onChange={e => setForm(f => ({ ...f, startYear: e.target.value }))} style={inputStyle}/></div>
        </div>
        {errors.start && <div style={errorStyle}>⚠ {errors.start}</div>}
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
              <input type="number" inputMode="numeric" min={MIN_YEAR} max={getToday().year + 5}
                value={form.endYear} onChange={e => setForm(f => ({ ...f, endYear: e.target.value }))} style={inputStyle} placeholder={String(getToday().year + 1)}/></div>
          </div>
        )}
        {errors.end && <div style={errorStyle}>⚠ {errors.end}</div>}
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
