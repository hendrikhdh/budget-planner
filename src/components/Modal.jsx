import { Icon } from "./Icon.jsx";

export const Modal = ({ open, onClose, title, children, T }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(8px)" }}/>
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", width: "100%", maxWidth: 480, maxHeight: "85vh", background: T.modalBg,
        backdropFilter: T.glassBlur,
        borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", overflowY: "auto",
        border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow,
        animation: "slideUp .3s ease"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: T.textPrimary, fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}><Icon name="x" size={22}/></button>
        </div>
        {children}
      </div>
    </div>
  );
};
