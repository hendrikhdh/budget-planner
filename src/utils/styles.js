export const createStyles = (T, isDark) => {
  const inputStyle = { width: "100%", padding: "10px 14px", background: T.inputBg, backdropFilter: T.glassBlur, border: `1px solid ${T.inputBorder}`, borderRadius: 10, color: T.inputText, fontSize: 14, outline: "none", boxSizing: "border-box", transition: "all .2s" };
  const selectStyle = { ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23${isDark ? '888' : '6b7280'}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" };
  const labelStyle = { display: "block", fontSize: 12, color: T.textMuted, marginBottom: 4, marginTop: 12 };
  const btnPrimary = { padding: "12px 24px", background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%", boxShadow: `0 4px 16px ${T.accent}30`, transition: "all .2s" };
  const btnSecondary = { padding: "10px 18px", background: T.glassCard, backdropFilter: T.glassBlur, border: `1px solid ${T.glassBorder}`, borderRadius: 10, color: T.textPrimary, fontSize: 13, cursor: "pointer", transition: "all .2s" };
  const chipStyle = (active) => ({ padding: "8px 18px", borderRadius: 20, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: active ? `linear-gradient(135deg, ${T.accent}, ${T.accentPink})` : T.chipInactiveBg, color: active ? "#fff" : T.chipInactiveText, transition: "all .2s" });
  const glassCardStyle = { background: T.glassCard, backdropFilter: T.glassBlur, borderRadius: 14, border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow, transition: "all .2s" };

  return { inputStyle, selectStyle, labelStyle, btnPrimary, btnSecondary, chipStyle, glassCardStyle };
};
