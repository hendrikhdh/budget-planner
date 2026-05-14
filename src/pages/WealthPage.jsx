import { useState, useMemo } from "react";
import { Icon } from "../components/Icon.jsx";
import { Modal } from "../components/Modal.jsx";
import { SwipeToDelete } from "../components/SwipeToDelete.jsx";
import { ConfirmDialog } from "../components/layout/ConfirmDialog.jsx";
import { LineChart } from "../charts/LineChart.jsx";
import {
  uid, fmt, monthName, todayISO,
  computeMonthlyBalances, computeTotalSeries, assetHistory
} from "../utils/helpers.js";

const signColor = (v, T) => v > 0 ? T.income : v < 0 ? T.expense : T.textPrimary;

export function WealthPage({ data, setData, T, styles }) {
  const { inputStyle, labelStyle, btnPrimary, glassCardStyle } = styles;
  const assets = data.assets || [];
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const emptyForm = { name: "", value: "", emoji: "", date: todayISO() };
  const [form, setForm] = useState(emptyForm);

  const monthlyBalances = useMemo(() => computeMonthlyBalances(data.entries), [data.entries]);
  const assetsTotal = useMemo(() => assets.reduce((s, a) => s + (Number(a.value) || 0), 0), [assets]);
  const monthsTotal = useMemo(() => monthlyBalances.reduce((s, m) => s + m.balance, 0), [monthlyBalances]);
  const grandTotal = assetsTotal + monthsTotal;
  const totalColor = signColor(grandTotal, T);

  const totalSeries = useMemo(() => computeTotalSeries(assets, data.entries, 12), [assets, data.entries]);

  const historyByAsset = useMemo(() => {
    const map = {};
    for (const a of assets) {
      map[a.id] = assetHistory(a).map(h => {
        const d = new Date(h.date);
        return { v: h.value, label: `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.` };
      });
    }
    return map;
  }, [assets]);

  const openNew = () => { setEditId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (a) => {
    setEditId(a.id);
    setForm({ name: a.name, value: "", emoji: a.emoji || "", date: todayISO() });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };

  const saveAsset = () => {
    const name = form.name.trim();
    if (!name) return;
    const valueRaw = form.value;
    const hasValue = valueRaw !== "" && !Number.isNaN(parseFloat(valueRaw));
    if (!editId && !hasValue) return;

    if (editId) {
      setData(prev => ({
        ...prev,
        assets: (prev.assets || []).map(a => {
          if (a.id !== editId) return a;
          if (!hasValue) {
            return { ...a, name, emoji: form.emoji };
          }
          const parsed = parseFloat(valueRaw);
          const current = assetHistory(a);
          const merged = [...current.filter(h => h.date !== form.date), { date: form.date, value: parsed }]
            .sort((x, y) => x.date.localeCompare(y.date));
          return { ...a, name, emoji: form.emoji, history: merged, value: merged[merged.length - 1].value };
        })
      }));
    } else {
      const parsed = parseFloat(valueRaw);
      const history = [{ date: form.date, value: parsed }];
      setData(prev => ({
        ...prev,
        assets: [...(prev.assets || []), { id: uid(), name, emoji: form.emoji, value: parsed, history }]
      }));
    }
    closeForm();
  };

  const deleteAsset = (id) => {
    setData(prev => ({ ...prev, assets: (prev.assets || []).filter(a => a.id !== id) }));
    if (editId === id) closeForm();
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
        <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, margin: 0 }}>Vermögen</h2>
        {assets.length > 0 && (
          <button onClick={() => setShowHistory(true)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", minHeight: 36,
            borderRadius: 999, cursor: "pointer",
            background: `${T.accent}14`, border: `1px solid ${T.accent}40`,
            color: T.accent, fontSize: 12, fontWeight: 700
          }}>
            <Icon name="trendUp" size={14} color={T.accent}/> Historie
          </button>
        )}
      </div>

      <div style={{
        ...glassCardStyle, padding: "22px 24px", textAlign: "center", marginBottom: 12
      }}>
        <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Gesamtsaldo</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: totalColor, lineHeight: 1.2 }}>{fmt(grandTotal)}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 14, fontSize: 11, color: T.textMuted }}>
          <span>Posten: <span style={{ color: signColor(assetsTotal, T), fontWeight: 600 }}>{fmt(assetsTotal)}</span></span>
          <span>Monate: <span style={{ color: signColor(monthsTotal, T), fontWeight: 600 }}>{fmt(monthsTotal)}</span></span>
        </div>
      </div>

      {totalSeries.length >= 2 && (
        <div style={{ ...glassCardStyle, padding: "10px 6px 4px", marginBottom: 20 }}>
          <LineChart points={totalSeries} color={T.accent} height={160} T={T}/>
        </div>
      )}

      <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 10 }}>Vermögensposten</div>
      {assets.length === 0
        ? <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>Noch keine Posten — tippe auf + um z.B. Aktien oder Tagesgeld hinzuzufügen</div>
        : assets.map(a => (
          <SwipeToDelete key={a.id} onDelete={() => deleteAsset(a.id)} T={T}>
            <div onClick={() => openEdit(a)} style={{
              background: T.glassCard, backdropFilter: T.glassBlur, borderRadius: 12,
              border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", cursor: "pointer", transition: "all .15s"
            }}>
              <span style={{ color: T.textPrimary, fontSize: 15, fontWeight: 600 }}>
                {a.emoji && <span style={{ marginRight: 8 }}>{a.emoji}</span>}{a.name}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: signColor(a.value || 0, T) }}>{fmt(a.value || 0)}</span>
            </div>
          </SwipeToDelete>
        ))}

      <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, margin: "20px 0 10px" }}>Monatsbilanzen</div>
      {monthlyBalances.length === 0
        ? <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>Noch keine Einträge erfasst</div>
        : monthlyBalances.map(m => {
          const bColor = signColor(m.balance, T);
          return (
            <div key={m.key} style={{ ...glassCardStyle, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
                  {monthName(m.month, m.year)}
                  {m.isCurrent && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      background: `${T.accent}22`, color: T.accent, textTransform: "uppercase", letterSpacing: 0.5
                    }}>laufend</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                  <span style={{ color: T.income }}>+{fmt(m.income)}</span>
                  <span style={{ margin: "0 6px" }}>·</span>
                  <span style={{ color: T.expense }}>−{fmt(m.expense)}</span>
                </div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: bColor }}>{fmt(m.balance)}</span>
            </div>
          );
        })}

      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Posten-Historie" T={T}>
        {assets.length === 0 ? (
          <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>Keine Posten vorhanden</div>
        ) : assets.map(a => {
          const pts = historyByAsset[a.id] || [];
          return (
            <div key={a.id} style={{ ...glassCardStyle, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
                  {a.emoji && <span style={{ marginRight: 6 }}>{a.emoji}</span>}{a.name}
                </span>
                <span style={{ fontSize: 12, color: signColor(a.value || 0, T), fontWeight: 700 }}>{fmt(a.value || 0)}</span>
              </div>
              <LineChart points={pts} color={T.accent} height={160} T={T}/>
            </div>
          );
        })}
      </Modal>

      <Modal open={showForm} onClose={closeForm} title={editId ? "Posten bearbeiten" : "Neuer Posten"} T={T}>
        <div style={{ display: "flex", gap: 8 }}>
          <div>
            <label style={labelStyle}>Emoji</label>
            <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} style={{ ...inputStyle, width: 52, textAlign: "center", fontSize: 22, padding: "6px" }} placeholder="📈"/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="z.B. Depot ING"/>
          </div>
        </div>
        <label style={labelStyle}>Datum</label>
        <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle}/>
        <label style={labelStyle}>{editId ? "Neuer Wert (€)" : "Wert (€)"}</label>
        <input type="number" inputMode="decimal" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} style={inputStyle} placeholder="0.00"/>
        {editId && (
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>Leer lassen, um nur Name/Emoji zu ändern.</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={saveAsset} style={btnPrimary}>{editId ? "Speichern" : "Hinzufügen"}</button>
        </div>
        {editId && (
          <button onClick={() => setConfirmDelete(editId)} style={{
            marginTop: 12, padding: "12px 18px", minHeight: 44, background: "none",
            border: `1px solid ${T.expense}40`, borderRadius: 10,
            color: T.expense, fontSize: 13, fontWeight: 600, cursor: "pointer",
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            <Icon name="trash" size={16} color={T.expense}/> Posten löschen
          </button>
        )}
      </Modal>

      {confirmDelete && (
        <ConfirmDialog T={T} styles={styles} danger
          title="Posten löschen?"
          text="Dieser Vermögensposten und seine Historie werden dauerhaft entfernt."
          confirmLabel="Löschen"
          onConfirm={() => { deleteAsset(confirmDelete); setConfirmDelete(null); closeForm(); }}
          onCancel={() => setConfirmDelete(null)}/>
      )}

      <button onClick={openNew} aria-label="Neuer Posten" style={{
        position: "fixed",
        bottom: "calc(88px + env(safe-area-inset-bottom))",
        right: "calc(20px + env(safe-area-inset-right))",
        width: 60, height: 60,
        borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`,
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 20px ${T.accent}50`, zIndex: 200, color: "#fff",
        WebkitTapHighlightColor: "transparent"
      }}>
        <Icon name="plus" size={26}/>
      </button>
    </div>
  );
}
