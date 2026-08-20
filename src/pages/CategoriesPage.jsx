import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { SwipeToDelete } from "../components/SwipeToDelete.jsx";
import { ConfirmDialog } from "../components/layout/ConfirmDialog.jsx";
import {
  CAT_COLORS, catName, catEmoji, catColorVal,
  UNASSIGNED, renameCategory, removeCategory, countCategoryUsage,
} from "../utils/categories.js";

// Must live outside CategoriesPage: as an inner component React creates a new
// type on every render, remounts the subtree and the color picker loses its state.
const ColorDots = ({ selected, onSelect, T, size = 26 }) => (
  <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
    {CAT_COLORS.map(c => {
      const isSelected = selected === c.hex;
      return (
        <button
          key={c.hex}
          onClick={() => onSelect(c.hex)}
          title={c.name}
          aria-label={c.name}
          style={{
            width: 44, height: 44, padding: 0, border: "none", background: "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span style={{
            width: size, height: size, borderRadius: "50%", background: c.hex,
            border: isSelected ? `2px solid ${T.textPrimary}` : "2px solid transparent",
            boxShadow: isSelected ? `0 0 8px ${c.hex}` : "none",
            display: "block", transition: "all .15s",
          }}/>
        </button>
      );
    })}
  </div>
);

export function CategoriesPage({ data, setData, T, styles }) {
  const { inputStyle, btnPrimary, chipStyle, glassCardStyle } = styles;
  const [newCat, setNewCat] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newColor, setNewColor] = useState(CAT_COLORS[0].hex);
  const [catType, setCatType] = useState("expense");
  // Kategorien werden über ihren NAMEN identifiziert, nicht über den Index:
  // die angezeigte Liste ist gefiltert, der Index passte deshalb nicht zum
  // gespeicherten Array — und dieselbe Namensreferenz benutzen auch entries,
  // recurring und budgets.
  const [editName, setEditName] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", emoji: "", color: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newScope, setNewScope] = useState("expense");
  const [addError, setAddError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const openAddForm = () => {
    setNewCat(""); setNewEmoji(""); setNewColor(CAT_COLORS[0].hex);
    setNewScope(catType);
    setAddError(null);
    setShowAddForm(true);
  };

  const existsInScope = (scope, name) =>
    (data.categories[scope] || []).some(c => catName(c).toLowerCase() === name.toLowerCase());

  // Gibt true zurück, wenn gespeichert wurde — nur dann schließt der Aufrufer
  // den Dialog.
  const addCat = () => {
    const name = newCat.trim();
    if (!name) { setAddError("Bitte einen Namen eingeben."); return false; }
    if (name.toLowerCase() === UNASSIGNED.toLowerCase()) {
      setAddError(`„${UNASSIGNED}" ist für Einträge ohne Kategorie reserviert.`);
      return false;
    }
    const scopes = newScope === "both" ? ["income", "expense"] : [newScope];
    const clash = scopes.find(scope => existsInScope(scope, name));
    if (clash) {
      setAddError(`„${name}" gibt es bei ${clash === "income" ? "Einnahmen" : "Ausgaben"} bereits.`);
      return false;
    }
    const item = { name, emoji: newEmoji || "", color: newColor };
    setData(prev => {
      const next = { ...prev.categories };
      scopes.forEach(scope => { next[scope] = [...(prev.categories[scope] || []), item]; });
      return { ...prev, categories: next };
    });
    setNewCat(""); setNewEmoji(""); setNewColor(CAT_COLORS[0].hex); setAddError(null);
    return true;
  };

  const removeCat = (type, name) => {
    setData(prev => removeCategory(prev, type, name));
    if (editName === name) setEditName(null);
  };

  const openEdit = (cat) => {
    const name = catName(cat);
    if (editName === name) { setEditName(null); return; }
    setEditForm({ name, emoji: catEmoji(cat), color: catColorVal(cat) });
    setEditError(null);
    setEditName(name);
  };

  const saveEdit = () => {
    if (editName === null) return;
    const name = editForm.name.trim();
    if (!name) { setEditError("Bitte einen Namen eingeben."); return; }
    if (name.toLowerCase() === UNASSIGNED.toLowerCase()) {
      setEditError(`„${UNASSIGNED}" ist für Einträge ohne Kategorie reserviert.`);
      return;
    }
    if (name.toLowerCase() !== editName.toLowerCase() && existsInScope(catType, name)) {
      setEditError(`„${name}" gibt es in dieser Liste bereits.`);
      return;
    }
    // Umbenennen zieht Einträge, wiederkehrende Regeln und das Budget mit um.
    setData(prev => renameCategory(prev, catType, editName, { name, emoji: editForm.emoji, color: editForm.color }));
    setEditName(null); setEditError(null);
  };

  const cats = (catType === "expense" ? data.categories.expense : data.categories.income)
    .filter(c => catName(c) !== UNASSIGNED);

  const deleteUsage = pendingDelete ? countCategoryUsage(data, pendingDelete.type, pendingDelete.name) : null;
  const deleteText = deleteUsage ? [
    deleteUsage.entries > 0
      ? `${deleteUsage.entries} ${deleteUsage.entries === 1 ? "Eintrag wird" : "Einträge werden"} auf „${UNASSIGNED}" verschoben.`
      : null,
    deleteUsage.recurring > 0
      ? `${deleteUsage.recurring} wiederkehrende ${deleteUsage.recurring === 1 ? "Regel bucht" : "Regeln buchen"} danach auf „${UNASSIGNED}".`
      : null,
    deleteUsage.hasBudget ? "Das Monatsbudget dieser Kategorie wird gelöscht." : null,
  ].filter(Boolean).join(" ") || "Diese Kategorie wird gelöscht." : "";
  const errorStyle = { fontSize: 11, color: T.expense, marginTop: 6, marginBottom: 2, lineHeight: 1.5 };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Kategorien</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => { setCatType("expense"); setEditName(null); setEditError(null); }} style={chipStyle(catType === "expense")}>Ausgaben</button>
        <button onClick={() => { setCatType("income"); setEditName(null); setEditError(null); }} style={chipStyle(catType === "income")}>Einnahmen</button>
      </div>
      {showAddForm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center",
          paddingBottom: "calc(72px + env(safe-area-inset-bottom))"
        }} onClick={() => setShowAddForm(false)}>
          <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(6px)" }}/>
          <div onClick={e => e.stopPropagation()} style={{
            position: "relative", width: "calc(100% - 16px)", maxWidth: 520,
            background: T.modalBg, backdropFilter: T.glassBlur,
            borderRadius: 20, padding: "24px 20px 24px",
            border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow, animation: "slideUp .3s ease"
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 14 }}>Neue Kategorie</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Verfügbar für</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <button onClick={() => setNewScope("expense")} style={chipStyle(newScope === "expense")}>Ausgabe</button>
              <button onClick={() => setNewScope("income")} style={chipStyle(newScope === "income")}>Einnahme</button>
              <button onClick={() => setNewScope("both")} style={chipStyle(newScope === "both")}>Beide</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="😀" style={{ ...inputStyle, width: 52, textAlign: "center", fontSize: 20, padding: "6px" }}/>
              <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && addCat()) setShowAddForm(false); }} placeholder="Neue Kategorie..." style={{ ...inputStyle, flex: 1 }}/>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Farbe wählen</div>
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{
                width: "100%", height: 40, border: `1px solid ${T.inputBorder}`, borderRadius: 10,
                background: T.inputBg, cursor: "pointer", padding: 2, display: "block", marginBottom: 10
              }}/>
              <ColorDots selected={newColor} onSelect={setNewColor} T={T}/>
            </div>
            {addError && <div style={errorStyle}>⚠ {addError}</div>}
            <button onClick={() => { if (addCat()) setShowAddForm(false); }} style={{ ...btnPrimary, padding: "10px 16px", fontSize: 13 }}>Hinzufügen</button>
          </div>
        </div>
      )}
      {cats.map((cat, i) => {
        const isEditing = editName === catName(cat);
        return (
          <SwipeToDelete key={catName(cat) + i} onDelete={(reset) => setPendingDelete({ type: catType, name: catName(cat), reset })} T={T} disabled={isEditing}>
            <div onClick={() => openEdit(cat)} style={{
              ...glassCardStyle, display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", cursor: "pointer",
              border: isEditing ? `1px solid ${T.accent}50` : glassCardStyle.border,
              borderRadius: isEditing ? "14px 14px 0 0" : 14,
              transition: "all .15s"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: catColorVal(cat), flexShrink: 0, boxShadow: `0 0 6px ${catColorVal(cat)}40` }}/>
                <span style={{ fontSize: 18, minWidth: 24, textAlign: "center" }}>{catEmoji(cat) || "·"}</span>
                <span style={{ color: T.textPrimary, fontSize: 14 }}>{catName(cat)}</span>
              </div>
              {isEditing && <Icon name="x" size={15} color={T.textMuted}/>}
            </div>
            {isEditing && (
              <div style={{
                background: T.glassCard, backdropFilter: T.glassBlur,
                borderRadius: "0 0 14px 14px", padding: "14px 16px",
                border: `1px solid ${T.accent}50`, borderTop: "none",
                boxShadow: T.glassShadow
              }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Emoji</div>
                    <input value={editForm.emoji} onChange={e => setEditForm(f => ({ ...f, emoji: e.target.value }))}
                      style={{ ...inputStyle, width: 52, textAlign: "center", fontSize: 22, padding: "6px" }} placeholder="😀"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Name</div>
                    <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && saveEdit()}
                      style={inputStyle}/>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Farbe</div>
                  <input type="color" value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} style={{
                    width: "100%", height: 36, border: `1px solid ${T.inputBorder}`, borderRadius: 10,
                    background: T.inputBg, cursor: "pointer", padding: 2, display: "block", marginBottom: 8
                  }}/>
                  <ColorDots selected={editForm.color} onSelect={(hex) => setEditForm(f => ({ ...f, color: hex }))} T={T} size={28}/>
                </div>
                {editError && <div style={errorStyle}>⚠ {editError}</div>}
                <button onClick={saveEdit} style={{ ...btnPrimary, padding: "10px 16px", fontSize: 13 }}>Speichern</button>
              </div>
            )}
          </SwipeToDelete>
        );
      })}
      <button onClick={openAddForm} aria-label="Neue Kategorie" style={{
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

      {pendingDelete && (
        <ConfirmDialog T={T} styles={styles} danger
          title={`„${pendingDelete.name}" löschen?`}
          text={deleteText}
          confirmLabel="Löschen"
          onConfirm={() => { removeCat(pendingDelete.type, pendingDelete.name); setPendingDelete(null); }}
          onCancel={() => { if (pendingDelete.reset) pendingDelete.reset(); setPendingDelete(null); }}/>
      )}
    </div>
  );
}
