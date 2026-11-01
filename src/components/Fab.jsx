import { Icon } from "./Icon.jsx";
import { useIsSplit } from "./layout/LayoutContext.js";

// Phone: sits above the BottomNav. Split layout: there is no BottomNav, so the
// button moves down to the corner of the detail column.
const PHONE_BOTTOM_OFFSET = 88;
const SPLIT_BOTTOM_OFFSET = 24;

export function Fab({ T, label, onClick }) {
  const isSplit = useIsSplit();
  const bottomOffset = isSplit ? SPLIT_BOTTOM_OFFSET : PHONE_BOTTOM_OFFSET;
  return (
    <button onClick={onClick} aria-label={label} style={{
      position: "fixed",
      bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))`,
      right: "calc(20px + env(safe-area-inset-right))",
      width: 60, height: 60,
      borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`,
      border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 4px 20px ${T.accent}50`, zIndex: 200, color: "#fff",
      WebkitTapHighlightColor: "transparent"
    }}>
      <Icon name="plus" size={26}/>
    </button>
  );
}
