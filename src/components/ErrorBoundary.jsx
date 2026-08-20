import { Component } from "react";
import { themes } from "../theme.js";
import { downloadJSON, getSnapshot } from "../lib/dataIO.js";
import { STORAGE_KEY, LS_SESSION_KEY } from "../utils/storage.js";

const THEME_KEY = "budget-planner-theme";

// The boundary renders outside the app shell, so it resolves the theme itself
// instead of going through useTheme.
const resolveTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return themes[saved];
  } catch { /* localStorage blocked */ }
  const prefersDark = typeof window !== "undefined" && window.matchMedia
    && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? themes.dark : themes.light;
};

const clearLocalCache = () => {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_KEY))
      .forEach(key => localStorage.removeItem(key));
    sessionStorage.removeItem(LS_SESSION_KEY);
  } catch { /* storage blocked */ }
};

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, exported: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[Money Maker] Render-Fehler:", error, info);
  }

  handleExport = () => {
    const snapshot = getSnapshot();
    if (snapshot && downloadJSON(JSON.stringify(snapshot, null, 2))) {
      this.setState({ exported: true });
    }
  };

  handleReload = () => window.location.reload();

  handleClearCache = () => {
    clearLocalCache();
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    const T = resolveTheme();
    const hasSnapshot = !!getSnapshot();
    const btn = {
      width: "100%", minHeight: 48, padding: "12px 20px", borderRadius: 12,
      fontSize: 15, fontWeight: 700, cursor: "pointer", border: "none",
      color: "#fff", background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`,
    };
    const btnGhost = {
      ...btn, background: "none", color: T.textPrimary,
      border: `1px solid ${T.inputBorder}`, fontWeight: 600, fontSize: 14,
    };

    return (
      <div style={{
        minHeight: "100vh", background: T.bgGradient, color: T.textPrimary,
        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px calc(24px + env(safe-area-inset-bottom))",
      }}>
        <div style={{
          width: "100%", maxWidth: 440, background: T.modalBg,
          border: `1px solid ${T.glassBorder}`, borderRadius: 20,
          padding: "28px 22px", boxShadow: T.glassShadow,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>😵</div>
          <h1 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800 }}>Da ist etwas schiefgelaufen</h1>
          <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.6, color: T.textSecondary }}>
            Die App konnte nicht angezeigt werden. Deine Daten in der Cloud sind davon nicht betroffen —
            sichere sie zur Vorsicht trotzdem, bevor du es erneut versuchst.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {hasSnapshot && (
              <button onClick={this.handleExport} style={btn}>
                {this.state.exported ? "✓ Daten gesichert" : "Daten als JSON sichern"}
              </button>
            )}
            <button onClick={this.handleReload} style={hasSnapshot ? btnGhost : btn}>
              App neu laden
            </button>
            <button onClick={this.handleClearCache} style={{ ...btnGhost, color: T.expense, borderColor: `${T.expense}40` }}>
              Zwischenspeicher leeren und neu laden
            </button>
          </div>

          <details style={{ marginTop: 20 }}>
            <summary style={{ fontSize: 12, color: T.textMuted, cursor: "pointer", minHeight: 24 }}>
              Technische Details
            </summary>
            <pre style={{
              marginTop: 10, padding: 12, borderRadius: 10, background: T.exportBg,
              color: T.exportText, fontSize: 11, lineHeight: 1.5,
              whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto",
            }}>{String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}</pre>
          </details>
        </div>
      </div>
    );
  }
}
