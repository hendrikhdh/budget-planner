import { fmt } from "../utils/helpers.js";
import { CAT_COLORS } from "../utils/categories.js";

export const EntryItem = ({ e, onClick, emojiLookup, colorLookup, T }) => {
  const emoji = emojiLookup ? emojiLookup(e.category, e.type) : "";
  const dotColor = colorLookup ? colorLookup(e.category, e.type) : CAT_COLORS[0].hex;
  return (
    <div onClick={onClick} style={{
      background: T.glassCard, backdropFilter: T.glassBlur, borderRadius: 12,
      border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow,
      display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer",
      transition: "all .15s"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: `0 0 6px ${dotColor}50` }}/>
        {emoji && <span style={{ fontSize: 18 }}>{emoji}</span>}
        <div>
          <div style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>{e.description || e.category}</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{e.category} · {new Date(e.date).toLocaleDateString("de-DE")}</div>
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: e.type === "income" ? T.income : T.expense }}>
        {e.type === "income" ? "+" : "−"}{fmt(e.amount)}
      </div>
    </div>
  );
};
