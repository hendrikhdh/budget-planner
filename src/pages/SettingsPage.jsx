import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { SyncPill } from "../components/layout/SyncBanner.jsx";

export function SettingsPage({ data, setData, T, styles, theme, toggleTheme, syncStatus, userInfo, onLogout }) {
  const { btnPrimary, glassCardStyle } = styles;
  const settings = data.settings || {};
  const [reminderEnabled, setReminderEnabled] = useState(!!settings.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime || "08:00");
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [saved, setSaved] = useState(false);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    return perm;
  };

  const handleSave = async () => {
    let perm = notifPermission;
    if (reminderEnabled && perm !== "granted") {
      perm = await requestPermission();
      if (perm !== "granted") return;
    }
    setData(prev => ({ ...prev, settings: { ...(prev.settings || {}), reminderEnabled, reminderTime } }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Der sichtbare Schalter bleibt 44x24 — die Trefferfläche wird 44x44.
  const toggleStyle = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 44, height: 44, minWidth: 44, minHeight: 44,
    background: "none", border: "none", cursor: "pointer", padding: 0,
    flexShrink: 0, WebkitTapHighlightColor: "transparent",
  };
  const trackStyle = (active) => ({
    position: "relative", display: "block", width: 44, height: 24, borderRadius: 12,
    background: active ? T.accent : `${T.textMuted}40`,
    transition: "background .2s",
  });
  const knobStyle = (active) => ({
    position: "absolute", top: 3, left: active ? 23 : 3, width: 18, height: 18,
    background: "#fff", borderRadius: "50%", transition: "left .2s",
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
  });

  const swSupported = "serviceWorker" in navigator;
  const notifSupported = typeof Notification !== "undefined";


  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 20, marginTop: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary }}>Einstellungen</div>
        <SyncPill T={T} syncStatus={syncStatus}/>
      </div>
      <div style={{ ...glassCardStyle, padding: "20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Icon name={theme === "dark" ? "moon" : "sun"} size={18} color={T.accent}/>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary }}>Erscheinungsbild</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>Dark Mode</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{theme === "dark" ? "Dunkles Design aktiv" : "Helles Design aktiv"}</div>
          </div>
          <button onClick={toggleTheme} style={toggleStyle}
            role="switch" aria-checked={theme === "dark"} aria-label="Dunkles Erscheinungsbild">
            <span style={trackStyle(theme === "dark")}><span style={knobStyle(theme === "dark")}/></span>
          </button>
        </div>
      </div>
      <div style={{ ...glassCardStyle, padding: "20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Icon name="bell" size={18} color={T.accent}/>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary }}>Tägliche Erinnerung</div>
        </div>
        {!swSupported || !notifSupported ? (
          <div style={{ fontSize: 13, color: T.textMuted, padding: "10px 14px", background: `${T.textMuted}10`, borderRadius: 10, lineHeight: 1.5 }}>
            Dein Browser unterstützt keine Push-Benachrichtigungen.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>Erinnerung aktivieren</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Täglich erinnern, Einnahmen & Ausgaben einzutragen</div>
              </div>
              <button onClick={() => setReminderEnabled(v => !v)} style={toggleStyle}
                role="switch" aria-checked={reminderEnabled} aria-label="Tägliche Erinnerung">
                <span style={trackStyle(reminderEnabled)}><span style={knobStyle(reminderEnabled)}/></span>
              </button>
            </div>
            {reminderEnabled && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: T.textSecondary, display: "block", marginBottom: 6 }}>Uhrzeit (24h-Format)</label>
                <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} style={{
                  background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 10,
                  color: T.inputText, fontSize: 20, fontWeight: 700, padding: "10px 14px",
                  outline: "none", width: "100%", cursor: "pointer"
                }}/>
              </div>
            )}
            {notifPermission === "denied" && (
              <div style={{ fontSize: 12, color: T.expense, padding: "8px 12px", background: `${T.expense}10`, borderRadius: 8, marginBottom: 12, lineHeight: 1.5 }}>
                ⚠ Benachrichtigungen sind im Browser blockiert. Bitte erlaube sie in den Browser-Einstellungen.
              </div>
            )}
            {reminderEnabled && notifPermission === "default" && (
              <div style={{ fontSize: 12, color: T.warning, padding: "8px 12px", background: `${T.warning}10`, borderRadius: 8, marginBottom: 12, lineHeight: 1.5 }}>
                Beim Speichern wirst du nach der Berechtigung für Benachrichtigungen gefragt.
              </div>
            )}
          </>
        )}
        <button onClick={handleSave} style={{ ...btnPrimary, marginTop: 4, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          {saved ? "✓ Gespeichert" : "Einstellungen speichern"}
        </button>
      </div>
      <div style={{ ...glassCardStyle, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Icon name="info" size={16} color={T.textMuted}/>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>Hinweis zur Erinnerung</div>
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
          Die Erinnerung wird als Browser-Benachrichtigung angezeigt und funktioniert nur, solange die App
          im Browser geöffnet ist. Wird sie geschlossen, beendet das System auch den Service Worker — die
          Erinnerung entfällt dann. Zuverlässige Benachrichtigungen im Hintergrund würden einen Push-Dienst
          erfordern; das Hinzufügen zum Home-Bildschirm allein ändert daran nichts.
        </div>
      </div>

      {(userInfo || onLogout) && (
        <div style={{ ...glassCardStyle, padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Icon name="info" size={18} color={T.accent}/>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary }}>Konto</div>
          </div>
          {userInfo && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              {userInfo.photo && (
                <img src={userInfo.photo} alt="" referrerPolicy="no-referrer" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }}/>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: T.textPrimary, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userInfo.name}</div>
                <div style={{ fontSize: 12, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userInfo.email}</div>
              </div>
            </div>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                width: "100%", minHeight: 44, padding: "12px 16px",
                background: `${T.expense}14`, border: `1px solid ${T.expense}40`, borderRadius: 12,
                color: T.expense, fontSize: 14, fontWeight: 700, cursor: "pointer",
                transition: "background .15s",
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: T.expense, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Abmelden
            </button>
          )}
        </div>
      )}
    </div>
  );
}
