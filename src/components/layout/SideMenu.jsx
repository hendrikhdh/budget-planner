import { Icon } from "../Icon.jsx";

const MENU_ITEMS = [
  { id: "home", icon: "home", label: "Übersicht" },
  { id: "search", icon: "search", label: "Suche & Filter" },
  { id: "income-analysis", icon: "trendUp", label: "Einnahmen-Analyse" },
  { id: "expense-analysis", icon: "trendDown", label: "Ausgaben-Analyse" },
  { id: "categories", icon: "tag", label: "Kategorien" },
  { id: "budget", icon: "wallet", label: "Budgets" },
  { id: "recurring", icon: "repeat", label: "Wiederkehrend" },
  { id: "savings", icon: "target", label: "Sparziele" },
  { id: "yearly", icon: "calendar", label: "Jahresübersicht" },
  { id: "prediction", icon: "zap", label: "Prognose" },
  { id: "import-export", icon: "download", label: "Import / Export" },
  { id: "settings", icon: "settings", label: "Einstellungen" },
];

export function SideMenu({ T, isDark, page, userInfo, onClose, onNavigate, onLogout }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, animation: "fadeIn .2s" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(6px)" }}/>
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 280,
        background: T.menuBg, backdropFilter: T.glassBlur,
        borderRight: `1px solid ${T.menuBorder}`,
        padding: "24px 0", boxShadow: isDark ? "8px 0 40px rgba(0,0,0,0.5)" : "8px 0 40px rgba(100,80,160,0.08)",
        animation: "slideIn .3s ease"
      }}>
        <div style={{ padding: "0 20px 20px", borderBottom: `1px solid ${T.headerBorder}`, marginBottom: 8 }}>
          <div onClick={() => onNavigate("home")} style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <img src={`${import.meta.env.BASE_URL}icons/icon-180x180.png`} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain", flexShrink: 0 }}/>
            <span style={{ color: T.titleGlow1, textShadow: isDark ? T.titleShadow1 : "none" }}>Budget</span>{" "}
            <span style={{ color: T.titleGlow2, textShadow: isDark ? T.titleShadow2 : "none" }}>Planer</span>
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Deine Finanzen im Blick</div>
          {userInfo && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 0" }}>
              {userInfo.photo && <img src={userInfo.photo} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} referrerPolicy="no-referrer"/>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.textPrimary, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userInfo.name}</div>
                <div style={{ fontSize: 10, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userInfo.email}</div>
              </div>
            </div>
          )}
        </div>
        {MENU_ITEMS.map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)} style={{
            display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "13px 20px",
            background: page === item.id ? `${T.accent}18` : "transparent",
            border: "none", borderLeft: page === item.id ? `3px solid ${T.accent}` : "3px solid transparent",
            color: page === item.id ? T.textPrimary : T.textMuted, fontSize: 14, fontWeight: page === item.id ? 700 : 500,
            cursor: "pointer", transition: "all .15s", textAlign: "left"
          }}>
            <Icon name={item.icon} size={18} color={page === item.id ? T.accent : T.textMuted}/>
            {item.label}
          </button>
        ))}
        <div style={{ borderTop: `1px solid ${T.headerBorder}`, marginTop: 8, paddingTop: 8 }}>
          <button onClick={onLogout} style={{
            display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "13px 20px",
            background: "transparent", border: "none", borderLeft: "3px solid transparent",
            color: T.expense, fontSize: 14, fontWeight: 500, cursor: "pointer", textAlign: "left"
          }}>
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: T.expense, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}
