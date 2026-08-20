import { useEffect } from "react";

// Kurzlebige Leiste über der BottomNav, die eine Löschung zurücknehmbar macht.
// Ersetzt den Bestätigungsdialog: der Wisch bleibt schnell, bleibt aber
// umkehrbar. `token` wechselt bei jeder neuen Löschung und startet den
// Countdown neu.
export function UndoSnackbar({ T, token, message, onUndo, onDismiss, duration = 5000 }) {
  useEffect(() => {
    if (!token) return undefined;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [token, duration, onDismiss]);

  if (!token) return null;

  return (
    <div role="status" aria-live="polite" style={{
      position: "fixed", zIndex: 300,
      bottom: "calc(84px + env(safe-area-inset-bottom))",
      left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 32px)", maxWidth: 488,
      background: T.glassCardOpaque || T.modalBg,
      border: `1px solid ${T.glassBorder}`, borderRadius: 14,
      boxShadow: T.glassShadow, overflow: "hidden",
      animation: "slideUp .25s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 10px 10px 16px" }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {message}
        </span>
        <button onClick={onUndo} style={{
          flexShrink: 0, minHeight: 44, padding: "0 16px",
          background: "none", border: "none", borderRadius: 10,
          color: T.accent, fontSize: 14, fontWeight: 700, cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}>
          Rückgängig
        </button>
      </div>
      <div style={{
        height: 2, background: T.accent, opacity: 0.5,
        animation: `importCountdown ${duration}ms linear forwards`,
      }}/>
    </div>
  );
}
