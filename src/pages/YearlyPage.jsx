import { fmt, getToday } from "../utils/helpers.js";
import { Icon } from "../components/Icon.jsx";
import { BarChart } from "../charts/BarChart.jsx";

export function YearlyPage({
  data, T, styles,
  viewYear, setViewYear, setViewMonth, setPage,
  balanceColor,
}) {
  const { btnSecondary, glassCardStyle } = styles;
  const yr = viewYear;
  const md = Array.from({ length: 12 }, (_, m) => {
    const me = data.entries.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === m && d.getFullYear() === yr;
    });
    return {
      label: new Date(yr, m).toLocaleString("de-DE", { month: "short" }),
      income: me.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0),
      expense: me.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0),
    };
  });
  md.forEach(m => m.balance = m.income - m.expense);
  const tI = md.reduce((s, m) => s + m.income, 0);
  const tE = md.reduce((s, m) => s + m.expense, 0);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, margin: 0 }}>Jahresübersicht {yr}</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setViewYear(y => y - 1)} aria-label="Vorheriges Jahr" style={{ ...btnSecondary, minWidth: 44, minHeight: 44, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="left" size={18}/>
          </button>
          <button onClick={() => setViewYear(getToday().year)} style={{ ...btnSecondary, minHeight: 44, padding: "0 14px", fontSize: 12, fontWeight: 700 }}>Aktuell</button>
          <button onClick={() => setViewYear(y => y + 1)} aria-label="Nächstes Jahr" style={{ ...btnSecondary, minWidth: 44, minHeight: 44, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="right" size={18}/>
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { l: "Einnahmen", v: tI, c: T.income },
          { l: "Ausgaben", v: tE, c: T.expense },
          { l: "Bilanz", v: tI - tE, c: balanceColor(tI - tE) },
        ].map(x => (
          <div key={x.l} style={{ flex: "1 1 100px", ...glassCardStyle, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{x.l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: x.c }}>{fmt(x.v)}</div>
          </div>
        ))}
      </div>
      <div style={{ ...glassCardStyle, padding: 16, marginBottom: 20 }}><BarChart data={md} T={T}/></div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.textMuted}30` }}>
              {["Monat", "Einnahmen", "Ausgaben", "Bilanz"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {md.map((m, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.tableRow}`, cursor: "pointer" }} onClick={() => { setViewMonth(i); setPage("home"); }}>
                <td style={{ padding: 10, color: T.textPrimary, fontWeight: 600 }}>{m.label}</td>
                <td style={{ padding: 10, color: T.income }}>{fmt(m.income)}</td>
                <td style={{ padding: 10, color: T.expense }}>{fmt(m.expense)}</td>
                <td style={{ padding: 10, color: balanceColor(m.balance), fontWeight: 700 }}>{fmt(m.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
