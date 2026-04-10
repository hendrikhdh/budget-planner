import { Icon } from "../Icon.jsx";
import { BackgroundOrbs } from "./BackgroundOrbs.jsx";

export function LoginScreen({ T, isDark, loginError, onLogin, toggleTheme }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      background: T.bgGradient,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      position: "relative",
      overflow: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: ${T.bg}; }
        @keyframes floatOrb1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,20px); } }
        @keyframes floatOrb2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-20px,30px); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <BackgroundOrbs isDark={isDark}/>

      <div style={{
        position: "relative", zIndex: 1,
        background: T.glassCard, backdropFilter: T.glassBlur,
        border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow,
        borderRadius: 24, padding: "40px 32px", maxWidth: 380, width: "100%",
        textAlign: "center", animation: "slideUp .5s ease"
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>
          <span style={{ color: T.titleGlow1, textShadow: isDark ? T.titleShadow1 : "none" }}>Money</span>{" "}
          <span style={{ color: T.titleGlow2, textShadow: isDark ? T.titleShadow2 : "none" }}>Maker</span>
        </div>
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 32 }}>Deine Finanzen im Blick – auf allen Geräten</div>

        <button onClick={onLogin} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          width: "100%", padding: "14px 20px",
          background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.85)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
          borderRadius: 14, cursor: "pointer", fontSize: 15, fontWeight: 600,
          color: T.textPrimary, transition: "all .2s",
          boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.08)"
        }}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.998 23.998 0 000 24c0 3.77.9 7.35 2.56 10.53l7.97-5.94z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.94C6.51 42.62 14.62 48 24 48z"/></svg>
          Mit Google anmelden
        </button>

        {loginError && (
          <div style={{ marginTop: 16, padding: "10px 14px", background: `${T.expense}15`, border: `1px solid ${T.expense}30`, borderRadius: 10, fontSize: 12, color: T.expense, lineHeight: 1.5 }}>
            {loginError}
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
          Melde dich mit deinem Google-Konto an,<br/>um deine Daten auf allen Geräten zu synchronisieren.
        </div>

        <button onClick={toggleTheme} style={{
          marginTop: 20, background: "none", border: "none", cursor: "pointer",
          color: T.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 6,
          margin: "20px auto 0"
        }}>
          <Icon name={isDark ? "sun" : "moon"} size={14} color={T.textMuted}/>
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </div>
  );
}
