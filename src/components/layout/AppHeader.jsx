import { Icon } from "../Icon.jsx";

export function AppHeader({ T, isDark, syncStatus, onMenu, onTitleClick }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px",
      background: T.headerBg, backdropFilter: T.glassBlur,
      borderBottom: `1px solid ${T.headerBorder}`,
      position: "fixed", top: 0, zIndex: 100,
      width: "100%", maxWidth: 520, left: "50%", transform: "translateX(-50%)",
      boxShadow: isDark ? "none" : "0 4px 20px rgba(100,80,160,0.06)"
    }}>
      <button onClick={onMenu} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: T.textPrimary }}>
        <Icon name="menu" size={22}/>
      </button>
      <span onClick={onTitleClick} style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, ...(isDark ? { animation: "neonPulse 3s ease-in-out infinite" } : {}) }}>
        <img src={`${import.meta.env.BASE_URL}icons/icon-180x180.png`} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain", flexShrink: 0 }}/>
        <span style={{ color: T.titleGlow1, textShadow: T.titleShadow1 }}>Budget</span>{" "}
        <span style={{ color: T.titleGlow2, textShadow: T.titleShadow2 }}>Planer</span>
        <span title={syncStatus === "synced" ? "Cloud-Sync aktiv" : syncStatus === "connecting" ? "Verbinde..." : "Offline – Daten lokal gespeichert"} style={{
          width: 7, height: 7, borderRadius: "50%", marginLeft: 4, flexShrink: 0,
          background: syncStatus === "synced" ? T.income : syncStatus === "connecting" ? T.warning : T.expense,
          boxShadow: `0 0 6px ${syncStatus === "synced" ? T.income : syncStatus === "connecting" ? T.warning : T.expense}60`,
          animation: syncStatus === "connecting" ? "neonPulse 1.5s ease-in-out infinite" : "none"
        }}/>
      </span>
      <div style={{ width: 32 }}/>
    </div>
  );
}
