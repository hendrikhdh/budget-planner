import { fmt, monthName } from "../utils/helpers.js";
import { DonutChart } from "../charts/DonutChart.jsx";
import { LineChart } from "../charts/LineChart.jsx";
import { EntryItem } from "../components/EntryItem.jsx";
import { groupByCategory } from "../lib/dataIO.js";

export function AnalysisPage({
  type, data, T, styles,
  viewMonth, viewYear, monthEntries,
  prevMonth, nextMonth, goToday,
  openEdit, emojiLookup, colorLookup,
}) {
  const { btnSecondary, glassCardStyle } = styles;
  const tl = type === "income" ? "Einnahmen" : "Ausgaben";
  const color = type === "income" ? T.income : T.expense;
  const mot = monthEntries.filter(e => e.type === type);
  const grouped = groupByCategory(mot);
  const dd = grouped
    .map((g) => ({ label: `${emojiLookup(g.category, type)} ${g.category}`.trim(), value: g.value, color: colorLookup(g.category, type) }))
    .sort((a, b) => b.value - a.value);

  const lp = [];
  for (let i = 11; i >= 0; i--) {
    let m = viewMonth - i, y = viewYear;
    while (m < 0) { m += 12; y--; }
    lp.push({
      v: data.entries.filter(e => {
        const d = new Date(e.date);
        return e.type === type && d.getMonth() === m && d.getFullYear() === y;
      }).reduce((s, e) => s + e.amount, 0),
      label: new Date(y, m).toLocaleString("de-DE", { month: "short" }),
    });
  }

  const total = dd.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{tl}-Analyse</h2>
      <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>{monthName(viewMonth, viewYear)}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <button onClick={prevMonth} aria-label="Vorheriger Monat" style={{ ...btnSecondary, minHeight: 44, padding: "0 16px", fontSize: 13, fontWeight: 600 }}>← Zurück</button>
        <button onClick={nextMonth} aria-label="Nächster Monat" style={{ ...btnSecondary, minHeight: 44, padding: "0 16px", fontSize: 13, fontWeight: 600 }}>Weiter →</button>
        <button onClick={goToday} style={{ ...btnSecondary, minHeight: 44, padding: "0 16px", fontSize: 13, fontWeight: 600 }}>Heute</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: "1 1 200px", display: "flex", justifyContent: "center" }}>
          <DonutChart data={dd} size={200} T={T}/>
        </div>
        <div style={{ flex: "1 1 200px" }}>
          {dd.map((d, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.tableRow}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, display: "inline-block" }}/>
                <span style={{ color: T.textSecondary, fontSize: 13 }}>{d.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: T.textMuted, fontSize: 12 }}>{total > 0 ? Math.round(d.value / total * 100) : 0}%</span>
                <span style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600, minWidth: 70, textAlign: "right" }}>{fmt(d.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...glassCardStyle, padding: "16px 8px", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 8, paddingLeft: 8 }}>Verlauf (12 Monate)</div>
        <LineChart points={lp} color={color} height={220} T={T}/>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 12 }}>Alle {tl} ({monthName(viewMonth, viewYear)})</div>
      {mot.length === 0
        ? <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>Keine {tl}</div>
        : [...mot].sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => (
          <EntryItem key={e.id} e={e} onClick={() => openEdit(e)} emojiLookup={emojiLookup} colorLookup={colorLookup} T={T}/>
        ))}
    </div>
  );
}
