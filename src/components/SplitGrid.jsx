import { useIsSplit } from "./layout/LayoutContext.js";

// Two card columns in the split layout; on phones the cards stay a plain stack.
export function SplitGrid({ children }) {
  const isSplit = useIsSplit();
  if (!isSplit) return children;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", columnGap: 12, alignItems: "start" }}>
      {children}
    </div>
  );
}
