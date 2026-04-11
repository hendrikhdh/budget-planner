import { Icon } from "../Icon.jsx";

export const NAV_TABS = [
  {
    id: "home",
    label: "Home",
    icon: "home",
    pages: [{ id: "home", label: "Übersicht" }],
  },
  {
    id: "analyse",
    label: "Analyse",
    icon: "trendUp",
    pages: [
      { id: "expense-analysis", label: "Ausgaben" },
      { id: "income-analysis", label: "Einnahmen" },
      { id: "yearly", label: "Jahr" },
      { id: "prediction", label: "Prognose" },
    ],
  },
  {
    id: "budget",
    label: "Budget",
    icon: "wallet",
    pages: [
      { id: "budget", label: "Budgets" },
      { id: "savings", label: "Sparziele" },
      { id: "recurring", label: "Wiederkehrend" },
    ],
  },
  {
    id: "search",
    label: "Suche",
    icon: "search",
    pages: [{ id: "search", label: "Suche" }],
  },
  {
    id: "more",
    label: "Mehr",
    icon: "settings",
    pages: [
      { id: "settings", label: "Einstellungen" },
      { id: "categories", label: "Kategorien" },
      { id: "import-export", label: "Import / Export" },
    ],
  },
];

export function findTabForPage(pageId) {
  return NAV_TABS.find(t => t.pages.some(p => p.id === pageId)) || NAV_TABS[0];
}

export function BottomNav({ T, isDark, page, onNavigate }) {
  const activeTab = findTabForPage(page);
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 520, zIndex: 100,
      background: T.headerBg, backdropFilter: T.glassBlur,
      borderTop: `1px solid ${T.headerBorder}`,
      paddingBottom: "env(safe-area-inset-bottom)",
      boxShadow: isDark ? "0 -4px 24px rgba(0,0,0,0.4)" : "0 -4px 20px rgba(100,80,160,0.06)",
      display: "flex",
    }}>
      {NAV_TABS.map(tab => {
        const isActive = tab.id === activeTab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.pages[0].id)}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, padding: "10px 4px", minHeight: 56,
              background: "none", border: "none", cursor: "pointer",
              color: isActive ? T.accent : T.textMuted,
              transition: "color .15s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Icon name={tab.icon} size={22} color={isActive ? T.accent : T.textMuted}/>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: 0.3 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function SubNav({ T, page, onNavigate }) {
  const activeTab = findTabForPage(page);
  if (activeTab.pages.length <= 1) return null;
  return (
    <div style={{
      display: "flex", gap: 8, padding: "12px 16px 4px",
      overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none",
      WebkitOverflowScrolling: "touch",
    }}>
      {activeTab.pages.map(p => {
        const active = p.id === page;
        return (
          <button
            key={p.id}
            onClick={() => onNavigate(p.id)}
            aria-current={active ? "page" : undefined}
            style={{
              flexShrink: 0, padding: "10px 16px", minHeight: 44,
              borderRadius: 999,
              border: `1px solid ${active ? T.accent : T.headerBorder}`,
              background: active ? `${T.accent}22` : "transparent",
              color: active ? T.accent : T.textMuted,
              fontSize: 13, fontWeight: active ? 700 : 600, cursor: "pointer",
              transition: "all .15s", whiteSpace: "nowrap",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
