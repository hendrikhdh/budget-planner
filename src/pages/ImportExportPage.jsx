import { useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { downloadJSON, copyExport, parseImportFile } from "../lib/dataIO.js";

export function ImportExportPage({ data, setData, T, styles, isDark, onMessage, onResetRequest }) {
  const { btnPrimary, btnSecondary, glassCardStyle } = styles;
  const fileInputRef = useRef(null);
  const [exportPreview, setExportPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const exportText = useMemo(() => JSON.stringify(data, null, 2), [data, exportPreview]);

  const handleExport = () => {
    if (!downloadJSON(exportText)) setExportPreview(true);
  };

  const handleCopy = async () => {
    if (await copyExport(exportText)) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleImport = async (ev) => {
    const file = ev.target.files[0];
    const sanitized = await parseImportFile(file, onMessage);
    if (sanitized) setData(sanitized);
    ev.target.value = "";
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Import / Export</h2>
      <div style={{ ...glassCardStyle, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Icon name="download" size={20} color={isDark ? "#00f0ff" : T.accent}/>
          <span style={{ color: T.textPrimary, fontSize: 16, fontWeight: 700 }}>Export</span>
        </div>
        <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 14 }}>Budget-Datenbasis als JSON exportieren.</p>
        <div style={{ display: "flex", gap: 8, marginBottom: exportPreview ? 12 : 0 }}>
          <button onClick={handleExport} style={{ ...btnPrimary, flex: 1 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="download" size={18}/> Herunterladen
            </span>
          </button>
          <button onClick={() => setExportPreview(p => !p)} style={{ ...btnSecondary, flex: "0 0 auto" }}>
            {exportPreview ? "Ausblenden" : "Daten anzeigen"}
          </button>
        </div>
        {exportPreview && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: T.textMuted }}>JSON-Daten ({Math.round(exportText.length / 1024)} KB)</span>
              <button onClick={handleCopy} style={{ ...btnSecondary, padding: "6px 14px", fontSize: 12, background: copySuccess ? T.incomeGlow : T.glassCard, color: copySuccess ? T.income : T.textPrimary }}>
                {copySuccess ? "✓ Kopiert!" : "In Zwischenablage kopieren"}
              </button>
            </div>
            <textarea id="export-textarea" readOnly value={exportText} style={{
              width: "100%", height: 180, padding: 12, background: T.exportBg, border: `1px solid ${T.inputBorder}`,
              borderRadius: 10, color: T.exportText, fontSize: 11, fontFamily: "monospace", resize: "vertical",
              outline: "none", boxSizing: "border-box"
            }} onFocus={e => e.target.select()}/>
          </div>
        )}
      </div>
      <div style={{ ...glassCardStyle, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Icon name="upload" size={20} color={T.accentPink}/>
          <span style={{ color: T.textPrimary, fontSize: 16, fontWeight: 700 }}>Import</span>
        </div>
        <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 14 }}>JSON-Datei importieren (überschreibt Daten).</p>
        <button onClick={() => fileInputRef.current?.click()} style={{ ...btnPrimary, background: `linear-gradient(135deg, ${T.accentPink}, ${T.accent})` }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="upload" size={18}/> JSON importieren
          </span>
        </button>
      </div>
      <div style={{ ...glassCardStyle, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Icon name="trash" size={20} color={T.expense}/>
          <span style={{ color: T.textPrimary, fontSize: 16, fontWeight: 700 }}>Zurücksetzen</span>
        </div>
        <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 14 }}>Alle Daten löschen.</p>
        <button onClick={onResetRequest} style={{ ...btnPrimary, background: `linear-gradient(135deg, ${T.expense}, #ff6b35)` }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="trash" size={18}/> Alle Daten löschen
          </span>
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }}/>
    </div>
  );
}
