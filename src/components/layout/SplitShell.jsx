const HOME_COLUMN_WIDTH = 400;

const columnStyle = {
  height: "100%",
  overflowY: "auto",
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
  paddingTop: "calc(8px + env(safe-area-inset-top))",
};

// Three independently scrolling columns: navigation rail, home, detail page.
// The columns must not use backdrop-filter or transforms: both would turn them
// into the containing block of the pages' position: fixed FABs and modals.
export function SplitShell({ T, rail, home, detail, detailRef }) {
  return (
    <div style={{ display: "flex", height: "100dvh", position: "relative", zIndex: 1 }}>
      {rail}
      <main style={{
        ...columnStyle,
        width: HOME_COLUMN_WIDTH, flexShrink: 0,
        borderRight: `1px solid ${T.headerBorder}`,
      }}>
        {home}
      </main>
      <section ref={detailRef} style={{
        ...columnStyle,
        flex: 1, minWidth: 0,
        paddingRight: "env(safe-area-inset-right)",
      }}>
        {detail}
      </section>
    </div>
  );
}
