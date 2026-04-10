import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { SwipeToDelete } from "../components/SwipeToDelete.jsx";
import { CAT_COLORS, catName, catEmoji, catColorVal } from "../utils/categories.js";

export function CategoriesPage({ data, setData, T, styles }) {
  const { inputStyle, selectStyle, labelStyle, btnPrimary, btnSecondary, chipStyle, glassCardStyle } = styles;
  const [newCat, setNewCat] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newColor, setNewColor] = useState(CAT_COLORS[0].hex);
  const [catType, setCatType] = useState("expense");
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", emoji: "", color: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  const addCat = () => {
    if (!newCat.trim()) return;
    setData(prev => ({ ...prev, categories: { ...prev.categories, [catType]: [...prev.categories[catType], { name: newCat.trim(), emoji: newEmoji || "", color: newColor }] } }));
    setNewCat(""); setNewEmoji(""); setNewColor(CAT_COLORS[0].hex);
  };
  const removeCat = (type, idx) => {
    const deletedName = catName(cats[idx]);
    setData(prev => ({
      ...prev,
      categories: { ...prev.categories, [type]: prev.categories[type].filter((_, i) => i !== idx) },
      entries: prev.entries.map(e =>
        e.type === type && e.category === deletedName ? { ...e, category: "Nicht zugeordnet" } : e
      )
    }));
    if (editIdx === idx) setEditIdx(null);
  };

  const openEdit = (i) => {
    if (editIdx === i) { setEditIdx(null); return; }
    const cat = cats[i];
    setEditForm({ name: catName(cat), emoji: catEmoji(cat), color: catColorVal(cat) });
    setEditIdx(i);
  };

  const saveEdit = () => {
    if (editIdx === null || !editForm.name.trim()) return;
    setData(prev => {
      const updated = [...prev.categories[catType]];
      updated[editIdx] = { name: editForm.name.trim(), emoji: editForm.emoji, color: editForm.color };
      return { ...prev, categories: { ...prev.categories, [catType]: updated } };
    });
    setEditIdx(null);
  };

  const cats = (catType === "expense" ? data.categories.expense : data.categories.income)
    .filter(c => catName(c) !== "Nicht zugeordnet");

  const ColorDots = ({ selected, onSelect, size = 18 }) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {CAT_COLORS.map(c => (
        <button key={c.hex} onClick={() => onSelect(c.hex)} style={{
          width: size, height: size, borderRadius: "50%", background: c.hex, border: selected === c.hex ? `2px solid ${T.textPrimary}` : "2px solid transparent",
          cursor: "pointer", padding: 0, boxShadow: selected === c.hex ? `0 0 8px ${c.hex}` : "none", transition: "all .15s"
        }} title={c.name}/>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Kategorien</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => { setCatType("expense"); setEditIdx(null); }} style={chipStyle(catType === "expense")}>Ausgaben</button>
        <button onClick={() => { setCatType("income"); setEditIdx(null); }} style={chipStyle(catType === "income")}>Einnahmen</button>
      </div>
      {showAddForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowAddForm(false)}>
          <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(6px)" }}/>
          <div onClick={e => e.stopPropagation()} style={{
            position: "relative", width: "100%", maxWidth: 520,
            background: T.modalBg, backdropFilter: T.glassBlur,
            borderRadius: "20px 20px 0 0", padding: "24px 20px 40px",
            border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow, animation: "slideUp .3s ease"
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 14 }}>Neue Kategorie</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="😀" style={{ ...inputStyle, width: 52, textAlign: "center", fontSize: 20, padding: "6px" }}/>
              <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { addCat(); setShowAddForm(false); } }} placeholder="Neue Kategorie..." style={{ ...inputStyle, flex: 1 }} autoFocus/>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Farbe wählen</div>
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{
                width: "100%", height: 40, border: `1px solid ${T.inputBorder}`, borderRadius: 10,
                background: T.inputBg, cursor: "pointer", padding: 2, display: "block", marginBottom: 10
              }}/>
              <ColorDots selected={newColor} onSelect={setNewColor}/>
            </div>
            <button onClick={() => { addCat(); setShowAddForm(false); }} style={{ ...btnPrimary, padding: "10px 16px", fontSize: 13 }}>Hinzufügen</button>
          </div>
        </div>
      )}
      {cats.map((cat, i) => {
        const isEditing = editIdx === i;
        return (
          <SwipeToDelete key={catName(cat) + i} onDelete={() => removeCat(catType, i)} T={T} disabled={isEditing}>
            <div onClick={() => openEdit(i)} style={{
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
                      style={inputStyle} autoFocus/>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Farbe</div>
                  <input type="color" value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} style={{
                    width: "100%", height: 36, border: `1px solid ${T.inputBorder}`, borderRadius: 10,
                    background: T.inputBg, cursor: "pointer", padding: 2, display: "block", marginBottom: 8
                  }}/>
                  <ColorDots selected={editForm.color} onSelect={(hex) => setEditForm(f => ({ ...f, color: hex }))} size={22}/>
                </div>
                <button onClick={saveEdit} style={{ ...btnPrimary, padding: "10px 16px", fontSize: 13 }}>Speichern</button>
              </div>
            )}
          </SwipeToDelete>
        );
      })}
      <button onClick={() => setShowAddForm(true)} style={{
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
