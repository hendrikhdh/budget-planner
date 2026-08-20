// Gemeinsame Quelle für die Darstellung des Sync-Zustands: Punkt im Header,
// Hinweisleiste über der Seite und Pille auf der Einstellungsseite lesen
// alle aus derselben Tabelle.
const syncState = (T, status) => {
  const states = {
    synced: { color: T.income, label: "Cloud-Sync aktiv", hint: null },
    connecting: { color: T.warning, label: "Verbinde …", hint: null },
    offline: {
      color: T.warning,
      label: "Offline – Daten lokal gespeichert",
      hint: "Deine Änderungen werden übertragen, sobald wieder eine Verbindung besteht.",
    },
    error: {
      color: T.expense,
      label: "Cloud-Sync fehlgeschlagen",
      hint: "Deine Änderungen liegen nur auf diesem Gerät. Bitte lade die App neu.",
    },
    quota: {
      color: T.expense,
      label: "Datensatz zu groß für die Cloud",
      hint: "Es wird nichts mehr gespeichert. Bitte exportiere deine Daten und lösche alte Einträge.",
    },
  };
  return states[status] || { color: T.expense, label: "Unbekannter Sync-Status", hint: null };
};

// Punkt in der Kopfzeile. Der sichtbare Punkt ist klein, die Trefferfläche
// erfüllt die 44px-Mindestgröße.
export function SyncDot({ T, syncStatus, onClick }) {
  const { color, label } = syncState(T, syncStatus);
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        position: "absolute", right: "calc(4px + env(safe-area-inset-right))",
        top: "calc(env(safe-area-inset-top))",
        width: 44, height: 44, minWidth: 44, minHeight: 44,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "none", border: "none", padding: 0, cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{
        width: 9, height: 9, borderRadius: "50%", background: color,
        boxShadow: `0 0 8px ${color}`, display: "block",
      }}/>
    </button>
  );
}

// Hinweisleiste am Seitenanfang — nur wenn es etwas zu melden gibt.
export function SyncBanner({ T, syncStatus }) {
  if (syncStatus === "synced" || syncStatus === "connecting") return null;
  const { color, label, hint } = syncState(T, syncStatus);
  return (
    <div role="status" aria-live="polite" style={{
      margin: "10px 16px 0", padding: "10px 14px", borderRadius: 12,
      background: `${color}14`, border: `1px solid ${color}40`,
      display: "flex", alignItems: "flex-start", gap: 10,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%", background: color,
        flexShrink: 0, marginTop: 5,
      }}/>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2, lineHeight: 1.5 }}>{hint}</div>}
      </div>
    </div>
  );
}

// Pille mit Punkt und Klartext — für Seiten, die den Zustand ausschreiben.
export function SyncPill({ T, syncStatus }) {
  const { color, label } = syncState(T, syncStatus);
  return (
    <div role="status" aria-live="polite" style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "8px 14px", minHeight: 36, borderRadius: 999,
      background: `${color}14`, border: `1px solid ${color}40`,
    }}>
      <span style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        background: color, boxShadow: `0 0 8px ${color}80`,
        animation: syncStatus === "connecting" ? "neonPulse 1.5s ease-in-out infinite" : "none",
      }}/>
      <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: 0.2 }}>{label}</span>
    </div>
  );
}
