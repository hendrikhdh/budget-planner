import { useEffect } from "react";
import { createPortal } from "react-dom";

// Beide Dialoge werden nach document.body portalisiert. Grund: das Eltern-Modal
// setzt `backdropFilter` auf seiner Karte, und ein Filter erzeugt einen neuen
// Containing Block — `position: fixed; inset: 0` deckte dadurch nur die Karte
// ab statt des Viewports.
const useEscape = (onEscape) => {
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === "Escape" && onEscape) onEscape(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onEscape]);
};

const overlayStyle = { position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" };

// Generic centered confirm dialog.
export function ConfirmDialog({ T, styles, title, text, confirmLabel, onConfirm, onCancel, danger }) {
  const { btnPrimary, btnSecondary } = styles;
  useEscape(onCancel);
  return createPortal(
    <div style={overlayStyle} onClick={onCancel}>
      <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(6px)" }}/>
      <div role="alertdialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()} style={{
        position: "relative", width: "85%", maxWidth: 360, background: T.modalBg, backdropFilter: T.glassBlur,
        borderRadius: 20, padding: "28px 24px", textAlign: "center",
        border: `1px solid ${danger ? T.expense : T.accent}30`, boxShadow: T.glassShadow,
        animation: "slideUp .3s ease"
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 20, lineHeight: 1.5 }}>{text}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ ...btnSecondary, flex: 1, minHeight: 44, padding: "12px 16px", fontSize: 15, fontWeight: 700 }}>Abbrechen</button>
          <button onClick={onConfirm} style={{ ...btnPrimary, flex: 1, minHeight: 44, background: danger ? `linear-gradient(135deg, ${T.expense}, #ff6b35)` : btnPrimary.background }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ImportMessageDialog({ T, styles, msg, onClose }) {
  const { btnPrimary } = styles;
  useEscape(onClose);
  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(6px)" }}/>
      <div role="alertdialog" aria-modal="true" aria-label={msg.title || (msg.type === "success" ? "Erfolgreich" : "Fehlgeschlagen")}
        onClick={e => e.stopPropagation()} style={{
          position: "relative", width: "85%", maxWidth: 380, background: T.modalBg, backdropFilter: T.glassBlur,
          borderRadius: 20, padding: "28px 24px 20px", textAlign: "center",
          border: `1px solid ${msg.type === "success" ? `${T.income}40` : `${T.expense}40`}`,
          boxShadow: T.glassShadow, animation: "slideUp .3s ease", overflow: "hidden"
        }}>
        <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">{msg.type === "success" ? "✅" : "❌"}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>{msg.title || (msg.type === "success" ? "Erfolgreich" : "Fehlgeschlagen")}</div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>{msg.text}</div>
        <button onClick={onClose} style={{ ...btnPrimary, minHeight: 44, background: msg.type === "success" ? T.income : T.expense }}>OK</button>
        {msg.type === "success" && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `${T.income}20`, borderRadius: "0 0 20px 20px" }}>
            <div style={{ height: "100%", background: T.income, borderRadius: "0 0 20px 20px", animation: "importCountdown 6s linear forwards" }}/>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
