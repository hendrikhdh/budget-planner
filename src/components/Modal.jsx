import { useEffect, useRef } from "react";
import { Icon } from "./Icon.jsx";

export const Modal = ({ open, onClose, title, children, T }) => {
  const panelRef = useRef(null);

  // Scroll-Lock und Fokus hängen NUR an `open`. Läge `onClose` mit in den
  // Abhängigkeiten, liefe der Effekt bei jedem Render neu — und merkte sich
  // beim zweiten Lauf "hidden" als vorherigen Wert, sodass der Body am Ende
  // dauerhaft gesperrt bliebe.
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (panelRef.current) panelRef.current.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center",
      paddingBottom: "calc(72px + env(safe-area-inset-bottom))"
    }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(8px)" }}/>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative", width: "calc(100% - 16px)", maxWidth: 480, maxHeight: "80vh", background: T.modalBg,
          backdropFilter: T.glassBlur,
          borderRadius: 20, padding: "20px 20px 24px", overflowY: "auto",
          border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow,
          animation: "slideUp .3s ease", outline: "none"
        }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: T.textPrimary, fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} aria-label="Dialog schließen" style={{
            background: "none", border: "none", cursor: "pointer", color: T.textMuted,
            width: 44, height: 44, minWidth: 44, minHeight: 44, padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "-10px -10px -10px 0", WebkitTapHighlightColor: "transparent"
          }}><Icon name="x" size={22}/></button>
        </div>
        {children}
      </div>
    </div>
  );
};
