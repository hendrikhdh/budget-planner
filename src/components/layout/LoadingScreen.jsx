export function LoadingScreen({ T, hasUser }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace", background: T.bgGradient,
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted
    }}>
      <style>{`body { margin: 0; background: ${T.bg}; }`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
        <div style={{ fontSize: 14 }}>{hasUser ? "Daten werden geladen..." : "Laden..."}</div>
      </div>
    </div>
  );
}
