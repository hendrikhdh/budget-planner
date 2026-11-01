import { Icon } from "../Icon.jsx";
import { NAV_TABS, findTabForPage } from "./BottomNav.jsx";
import { SyncDot } from "./SyncBanner.jsx";

const RAIL_WIDTH = 76;
// Home stays visible in its own column and needs no navigation entry.
const RAIL_TABS = NAV_TABS.filter(tab => tab.id !== "home");

export function NavRail({ T, isDark, page, pulseId = 0, syncStatus, onNavigate, onHome, onNewEntry, onStatusClick }) {
  const activeTab = findTabForPage(page);
  return (
    <nav aria-label="Hauptnavigation" style={{
      width: `calc(${RAIL_WIDTH}px + env(safe-area-inset-left))`, flexShrink: 0,
      paddingTop: "calc(12px + env(safe-area-inset-top))",
      paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
      paddingLeft: "env(safe-area-inset-left)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      background: T.headerBg, backdropFilter: T.glassBlur,
      borderRight: `1px solid ${T.headerBorder}`,
      boxShadow: isDark ? "none" : "4px 0 20px rgba(100,80,160,0.06)",
    }}>
      <button key={pulseId} onClick={onHome} aria-label="Money Maker – Startansicht" style={{
        width: 52, height: 52, padding: 0, background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        WebkitTapHighlightColor: "transparent",
        ...(pulseId > 0 ? { animation: "brandGlow 1.5s ease-out" } : {}),
      }}>
        <img src={`${import.meta.env.BASE_URL}icons/icon-180x180.png`} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain" }}/>
      </button>

      <button onClick={onNewEntry} aria-label="Neuer Eintrag" style={{
        width: 52, height: 52, marginBottom: 16, borderRadius: "50%",
        background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`,
        border: "none", cursor: "pointer", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 20px ${T.accent}50`,
        WebkitTapHighlightColor: "transparent",
      }}>
        <Icon name="plus" size={24}/>
      </button>

      {RAIL_TABS.map(tab => {
        const isActive = tab.id === activeTab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.pages[0].id)}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            style={{
              width: 64, minHeight: 60, padding: "8px 2px", borderRadius: 14,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
              background: isActive ? `${T.accent}22` : "none", border: "none", cursor: "pointer",
              color: isActive ? T.accent : T.textMuted,
              transition: "color .15s, background .15s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Icon name={tab.icon} size={22} color={isActive ? T.accent : T.textMuted}/>
            <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, letterSpacing: 0.3 }}>{tab.label}</span>
          </button>
        );
      })}

      {/* SyncDot positions itself absolutely; this wrapper anchors it in the rail. */}
      {syncStatus && (
        <div style={{ position: "relative", width: 52, height: 44, marginTop: "auto" }}>
          <SyncDot T={T} syncStatus={syncStatus} onClick={onStatusClick}/>
        </div>
      )}
    </nav>
  );
}
