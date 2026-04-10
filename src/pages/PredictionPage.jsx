import { useState, useMemo } from "react";
import { Icon } from "../components/Icon.jsx";
import { fmt, fmtShort, getToday } from "../utils/helpers.js";
import {
  weightedMovingAvg, holtSmoothing, linearRegression,
  seasonalForecast, ensembleForecast, variance
} from "../utils/prediction.js";

export function PredictionPage({ data, T, styles }) {
  const { glassCardStyle, btnSecondary, chipStyle } = styles;
  const [showMethod, setShowMethod] = useState(null);

  const monthlyData = useMemo(() => {
    const map = {};
    data.entries.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = { year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 };
      if (e.type === "income") map[key].income += e.amount;
      else map[key].expense += e.amount;
    });
    return Object.values(map).sort((a, b) => a.year - b.year || a.month - b.month);
  }, [data.entries]);

  const expenses = monthlyData.map(m => m.expense);
  const incomes = monthlyData.map(m => m.income);

  const recurringExpense = data.recurring.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const recurringIncome = data.recurring.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0);

  const HORIZON = 6;
  const expEnsemble = ensembleForecast(expenses, monthlyData, HORIZON);
  const incEnsemble = ensembleForecast(incomes, monthlyData.map(m => ({ ...m, expense: m.income })), HORIZON);

  const expStd = variance(expenses);
  const incStd = variance(incomes);

  const lastEntry = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : { month: getToday().month, year: getToday().year };

  const forecastLabels = Array(HORIZON).fill(0).map((_, i) => {
    let m = lastEntry.month + 1 + i;
    let y = lastEntry.year;
    while (m > 11) { m -= 12; y++; }
    return new Date(y, m).toLocaleString("de-DE", { month: "short", year: "2-digit" });
  });

  const ForecastChart = ({ historical, forecast, forecastHigh, forecastLow, color, label, height = 260 }) => {
    const all = [...historical.slice(-8), ...forecast];
    const w = 500, h = 220, padX = 30, padTop = 28, padBot = 30;
    const chartH = h - padTop - padBot;
    const maxV = Math.max(...all, ...forecastHigh, 1);
    const totalPts = all.length;
    const histCount = Math.min(historical.length, 8);
    const histSlice = historical.slice(-8);

    const histLabels = monthlyData.slice(-(histCount)).map(m =>
      new Date(m.year, m.month).toLocaleString("de-DE", { month: "short" })
    );
    const allLabels = [...histLabels, ...forecastLabels];

    const getX = (i) => padX + (i / (totalPts - 1)) * (w - padX * 2);
    const getY = (v) => padTop + chartH - (v / maxV) * chartH;

    const histCoords = histSlice.map((v, i) => ({ x: getX(i), y: getY(v) }));
    const fcCoords = forecast.map((v, i) => ({ x: getX(histCount + i), y: getY(v) }));
    const hiCoords = forecastHigh.map((v, i) => ({ x: getX(histCount + i), y: getY(v) }));
    const loCoords = forecastLow.map((v, i) => ({ x: getX(histCount + i), y: getY(v) }));

    const histPath = histCoords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
    const bridgePath = histCoords.length > 0 && fcCoords.length > 0
      ? `M ${histCoords[histCoords.length - 1].x} ${histCoords[histCoords.length - 1].y} L ${fcCoords[0].x} ${fcCoords[0].y}`
      : "";
    const fcPath = fcCoords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

    const bandPath = hiCoords.length > 0
      ? `M ${hiCoords[0].x} ${hiCoords[0].y} ` +
        hiCoords.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ") + " " +
        loCoords.slice().reverse().map((c, i) => `${i === 0 ? "L" : "L"} ${c.x} ${c.y}`).join(" ") + " Z"
      : "";

    const gid = `fc-${color.replace("#", "")}-${Math.random().toString(36).slice(2, 6)}`;

    return (
      <div style={{ width: "100%" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>{label}</div>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="xMidYMid meet">
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
            const gy = padTop + chartH - f * chartH;
            return <line key={i} x1={padX} y1={gy} x2={w - padX} y2={gy} stroke={T.gridLine} strokeWidth={0.5}/>;
          })}
          {histCoords.length > 0 && <line x1={histCoords[histCoords.length - 1].x + 6} y1={padTop} x2={histCoords[histCoords.length - 1].x + 6} y2={padTop + chartH} stroke={T.textMuted} strokeWidth={0.5} strokeDasharray="4 4"/>}
          {bandPath && <path d={bandPath} fill={color} opacity={0.08}/>}
          <path d={histPath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round"/>
          {bridgePath && <path d={bridgePath} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.5}/>}
          <path d={fcPath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeDasharray="6 3"/>
          {histCoords.map((c, i) => <circle key={`h${i}`} cx={c.x} cy={c.y} r={3.5} fill={color} stroke={T.donutCenter} strokeWidth={1.5}/>)}
          {fcCoords.map((c, i) => <circle key={`f${i}`} cx={c.x} cy={c.y} r={4} fill={T.donutCenter} stroke={color} strokeWidth={2}/>)}
          {fcCoords.map((c, i) => <text key={`fv${i}`} x={c.x} y={c.y - 10} textAnchor="middle" fill={color} fontSize={10} fontWeight="700">{fmtShort(forecast[i])}</text>)}
          {allLabels.map((l, i) => <text key={`l${i}`} x={getX(i)} y={h - 6} textAnchor="middle" fill={i >= histCount ? color : T.chartTextMuted} fontSize={9} fontWeight={i >= histCount ? "700" : "500"}>{l}</text>)}
          <text x={padX} y={14} fill={T.chartTextMuted} fontSize={9}>Historisch</text>
          <text x={w - padX} y={14} textAnchor="end" fill={color} fontSize={9} fontWeight="600">Prognose →</text>
        </svg>
      </div>
    );
  };

  const expHigh = expEnsemble.map(v => Math.round((v + expStd * 0.8) * 100) / 100);
  const expLow = expEnsemble.map(v => Math.max(0, Math.round((v - expStd * 0.8) * 100) / 100));
  const incHigh = incEnsemble.map(v => Math.round((v + incStd * 0.6) * 100) / 100);
  const incLow = incEnsemble.map(v => Math.max(0, Math.round((v - incStd * 0.6) * 100) / 100));

  const methods = [
    { key: "wma", name: "Gewichteter Ø", desc: "Neuere Monate zählen stärker. Einfach, stabil, reagiert langsam auf Trendwechsel.", exp: expenses, fn: weightedMovingAvg },
    { key: "holt", name: "Holt-Smoothing", desc: "Erfasst Level + Trend durch exponentielle Glättung mit zwei Parametern (α, β). Reagiert dynamisch auf Veränderungen.", exp: expenses, fn: holtSmoothing },
    { key: "lr", name: "Lineare Regression", desc: "Berechnet die Trendgerade (y = a + bx) per Least-Squares. Gut für konstante Trends, schlecht bei Richtungswechseln.", exp: expenses, fn: linearRegression },
    { key: "seasonal", name: "Saisonale Dekomposition", desc: "Erkennt Muster pro Kalendermonat (z.B. Dezember = teuer). Kombiniert Saisonindizes mit Holt-Basis.", exp: expenses, fn: (arr) => seasonalForecast(arr, monthlyData, HORIZON) },
  ];

  const balanceForecast = expEnsemble.map((e, i) => incEnsemble[i] - e);
  const dataAvailable = monthlyData.length >= 2;

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Prognose</h2>
      <p style={{ color: T.textMuted, fontSize: 12, marginBottom: 20, lineHeight: 1.5 }}>
        KI-gestützte Vorhersage deiner Finanzen für die nächsten {HORIZON} Monate
      </p>

      {!dataAvailable ? (
        <div style={{ ...glassCardStyle, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
          <div style={{ color: T.textPrimary, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Zu wenig Daten</div>
          <div style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.5 }}>Mindestens 2 Monate mit Einträgen werden benötigt, um eine Prognose zu erstellen.</div>
        </div>
      ) : (
        <>
          {(() => {
            const currentYear = getToday().year;
            const ytdIncome = monthlyData.filter(m => m.year === currentYear).reduce((s, m) => s + m.income, 0);
            const ytdExpense = monthlyData.filter(m => m.year === currentYear).reduce((s, m) => s + m.expense, 0);
            const ytdBalance = ytdIncome - ytdExpense;
            let fcIncome = 0, fcExpense = 0;
            balanceForecast.forEach((_, i) => {
              let m = lastEntry.month + 1 + i;
              let y = lastEntry.year;
              while (m > 11) { m -= 12; y++; }
              if (y === currentYear) { fcIncome += incEnsemble[i]; fcExpense += expEnsemble[i]; }
            });
            const projBalance = ytdBalance + fcIncome - fcExpense;
            const projColor = projBalance >= 0 ? T.income : T.expense;
            const totalFcIncome = incEnsemble.reduce((s, v) => s + v, 0);
            const totalFcExpense = expEnsemble.reduce((s, v) => s + v, 0);
            const totalFcBalance = totalFcIncome - totalFcExpense;
            return (
              <div style={{ ...glassCardStyle, padding: "18px 20px", marginBottom: 16, border: `1px solid ${projColor}30` }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Jahresprognose {currentYear}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 2 }}>Erwartete Jahresbilanz</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: projColor, lineHeight: 1.1 }}>{fmt(projBalance)}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>YTD {fmt(ytdBalance)} + Prognose {fmt(fcIncome - fcExpense)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: `${T.income}10`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>Prognose Einnahmen</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.income }}>+{fmt(totalFcIncome)}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{HORIZON} Monate</div>
                  </div>
                  <div style={{ flex: 1, background: `${T.expense}10`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>Prognose Ausgaben</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.expense }}>−{fmt(totalFcExpense)}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{HORIZON} Monate</div>
                  </div>
                  <div style={{ flex: 1, background: `${totalFcBalance >= 0 ? T.income : T.expense}10`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>Prognose Bilanz</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: totalFcBalance >= 0 ? T.income : T.expense }}>{fmt(totalFcBalance)}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{HORIZON} Monate</div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { l: "Ø Ausgaben", v: expEnsemble.reduce((s, v) => s + v, 0) / HORIZON, c: T.expense },
              { l: "Ø Einnahmen", v: incEnsemble.reduce((s, v) => s + v, 0) / HORIZON, c: T.income },
              { l: "Ø Bilanz", v: balanceForecast.reduce((s, v) => s + v, 0) / HORIZON, c: balanceForecast.reduce((s, v) => s + v, 0) / HORIZON >= 0 ? T.income : T.expense },
            ].map(x => (
              <div key={x.l} style={{ flex: "1 1 90px", ...glassCardStyle, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{x.l}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: x.c }}>{fmt(x.v)}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>/ Monat</div>
              </div>
            ))}
          </div>

          <div style={{ ...glassCardStyle, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="repeat" size={16} color={T.accent}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: T.textSecondary }}>Feste monatliche Basis</div>
              <div style={{ fontSize: 13, color: T.textPrimary, fontWeight: 600, marginTop: 2 }}>
                <span style={{ color: T.income }}>+{fmt(recurringIncome)}</span>
                {" "}·{" "}
                <span style={{ color: T.expense }}>−{fmt(recurringExpense)}</span>
              </div>
            </div>
          </div>

          <div style={{ ...glassCardStyle, padding: "16px 8px", marginBottom: 16 }}>
            <ForecastChart historical={expenses} forecast={expEnsemble} forecastHigh={expHigh} forecastLow={expLow} color={T.expense} label="Ausgaben-Prognose" />
          </div>

          <div style={{ ...glassCardStyle, padding: "16px 8px", marginBottom: 16 }}>
            <ForecastChart historical={incomes} forecast={incEnsemble} forecastHigh={incHigh} forecastLow={incLow} color={T.income} label="Einnahmen-Prognose" />
          </div>

          <div style={{ ...glassCardStyle, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 10 }}>Monatsübersicht Prognose</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.textMuted}30` }}>
                {["Monat", "Einnahmen", "Ausgaben", "Bilanz"].map(h => <th key={h} style={{ padding: "6px 4px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>{h}</th>)}
              </tr></thead>
              <tbody>{forecastLabels.map((label, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.tableRow}` }}>
                  <td style={{ padding: "8px 4px", color: T.textPrimary, fontWeight: 600 }}>{label}</td>
                  <td style={{ padding: "8px 4px", color: T.income }}>{fmt(incEnsemble[i])}</td>
                  <td style={{ padding: "8px 4px", color: T.expense }}>{fmt(expEnsemble[i])}</td>
                  <td style={{ padding: "8px 4px", color: balanceForecast[i] >= 0 ? T.income : T.expense, fontWeight: 700 }}>{fmt(balanceForecast[i])}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div style={{ ...glassCardStyle, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>Methodenvergleich (Ausgaben)</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12, lineHeight: 1.4 }}>
              Die Ensemble-Prognose oben kombiniert alle Methoden gewichtet. Hier siehst du jede einzeln:
            </div>
            {methods.map(m => {
              const vals = m.key === "seasonal" ? m.fn(m.exp) : m.fn(m.exp, HORIZON);
              const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
              return (
                <div key={m.key} style={{ marginBottom: 8 }}>
                  <div onClick={() => setShowMethod(showMethod === m.key ? null : m.key)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", cursor: "pointer", borderBottom: `1px solid ${T.tableRow}` }}>
                    <div>
                      <div style={{ fontSize: 13, color: T.textPrimary, fontWeight: 600 }}>{m.name}</div>
                      {showMethod === m.key && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, lineHeight: 1.4, maxWidth: 300 }}>{m.desc}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.expense }}>Ø {fmt(avg)}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>/ Monat</div>
                    </div>
                  </div>
                  {showMethod === m.key && (
                    <div style={{ display: "flex", gap: 6, padding: "8px 0", overflowX: "auto" }}>
                      {forecastLabels.map((l, i) => (
                        <div key={i} style={{ flex: "0 0 auto", background: `${T.expense}10`, borderRadius: 8, padding: "6px 10px", textAlign: "center", minWidth: 60 }}>
                          <div style={{ fontSize: 10, color: T.textMuted }}>{l}</div>
                          <div style={{ fontSize: 12, color: T.expense, fontWeight: 700, marginTop: 2 }}>{fmt(vals[i])}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ ...glassCardStyle, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Icon name="info" size={16} color={T.accent}/>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>So funktioniert die Prognose</div>
            </div>
            <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>
              <div style={{ marginBottom: 10 }}>
                Die Vorhersage nutzt ein <strong style={{ color: T.textPrimary }}>Ensemble-Modell</strong>, das vier unabhängige Algorithmen gewichtet kombiniert:
              </div>
              <div style={{ marginBottom: 8, paddingLeft: 8, borderLeft: `2px solid ${T.accent}30` }}>
                <strong style={{ color: T.textPrimary }}>1. Gewichteter gleitender Durchschnitt (15%)</strong><br/>
                Berechnet den Durchschnitt der letzten 6 Monate, wobei neuere Monate linear stärker gewichtet werden (Gewicht = Position). Stabil, aber träge bei Trendwechseln.
              </div>
              <div style={{ marginBottom: 8, paddingLeft: 8, borderLeft: `2px solid ${T.accent}30` }}>
                <strong style={{ color: T.textPrimary }}>2. Holt's Double Exponential Smoothing (30%)</strong><br/>
                Zwei Parameter (α=0.4 für Level, β=0.2 für Trend) glätten die Zeitreihe exponentiell. Erfasst sowohl das aktuelle Niveau als auch die Richtung der Veränderung. Haupttreiber der Prognose.
              </div>
              <div style={{ marginBottom: 8, paddingLeft: 8, borderLeft: `2px solid ${T.accent}30` }}>
                <strong style={{ color: T.textPrimary }}>3. Lineare Regression (20%)</strong><br/>
                Legt eine Trendgerade (y = a + bx) per Methode der kleinsten Quadrate durch alle historischen Datenpunkte. Gut für langfristige Richtung, ignoriert aber saisonale Schwankungen.
              </div>
              <div style={{ marginBottom: 10, paddingLeft: 8, borderLeft: `2px solid ${T.accent}30` }}>
                <strong style={{ color: T.textPrimary }}>4. Saisonale Dekomposition (35%)</strong><br/>
                Berechnet pro Kalendermonat einen Saisonindex (Dez = höher, Feb = niedriger) und multipliziert diesen mit einer Holt-Basisprognose. Höchste Gewichtung, da Ausgaben-Muster oft saisonal sind.
              </div>
              <div style={{ marginBottom: 8 }}>
                Das <strong style={{ color: T.textPrimary }}>Konfidenzband</strong> (schattierter Bereich im Chart) basiert auf der historischen Standardabweichung deiner Ausgaben (±0.8σ) und zeigt den wahrscheinlichen Schwankungsbereich.
              </div>
              <div style={{ padding: "8px 10px", background: `${T.accent}08`, borderRadius: 8, fontSize: 11, color: T.textMuted }}>
                💡 Die Prognose-Qualität steigt mit der Datenmenge. Ab 6+ Monaten sind die Saisonmuster besonders zuverlässig. Wiederkehrende Buchungen (Miete, Abos) bilden das stabile Fundament.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
