import { fmtShort } from "../utils/helpers.js";

// fmtShort kennt nur positive Zahlen: die Prüfung `n >= 1000` greift bei -5000
// nicht, herauskäme "-5000" statt "-5k". Vorzeichen deshalb separat setzen.
const shortLabel = (v) => (v < 0 ? "\u2212" : "") + fmtShort(Math.abs(v));

export const LineChart = ({ points, color = "#00f0ff", height = 240, T }) => {
  const w = 500, h = 200, padX = 30, padTop = 28, padBot = 30;
  const chartH = h - padTop - padBot;
  if (points.length < 2) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, fontSize: 13 }}>Nicht genug Daten</div>;
  const values = points.map(p => (Number.isFinite(p.v) ? p.v : 0));
  // Die Skala schließt IMMER die Nulllinie ein. Vorher war sie bei 0 verankert
  // und nur nach oben begrenzt — eine durchgehend negative Reihe (Vermögen ohne
  // Posten) landete dadurch weit unterhalb der viewBox und blieb unsichtbar.
  const maxV = Math.max(...values, 0);
  const minV = Math.min(...values, 0);
  const span = (maxV - minV) || 1;
  const toY = (v) => padTop + chartH - ((v - minV) / span) * chartH;
  const zeroY = toY(0);
  const coords = values.map((v, i) => ({
    x: padX + (i / (points.length - 1)) * (w - padX * 2),
    y: toY(v),
  }));
  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  // Fläche bis zur Nulllinie statt bis zum Rahmenboden.
  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${zeroY} L ${coords[0].x} ${zeroY} Z`;
  const gid = `lg-${color.replace("#", "")}-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="xMidYMid meet">
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.25}/><stop offset="100%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const gy = padTop + chartH - f * chartH;
          return <line key={i} x1={padX} y1={gy} x2={w - padX} y2={gy} stroke={T.gridLine} strokeWidth={0.5}/>;
        })}
        <path d={areaD} fill={`url(#${gid})`}/>
        {minV < 0 && <line x1={padX} y1={zeroY} x2={w - padX} y2={zeroY} stroke={T.chartTextMuted} strokeWidth={1} strokeDasharray="3 3"/>}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round"/>
        {coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={4} fill={color} stroke={T.donutCenter} strokeWidth={1.5}/>)}
        {coords.map((c, i) => values[i] !== 0 && <text key={`v${i}`} x={c.x} y={c.y - 10} textAnchor="middle" fill={T.chartText} fontSize={11} fontWeight="700">{shortLabel(values[i])}</text>)}
        {coords.map((c, i) => <text key={`t${i}`} x={c.x} y={h - 6} textAnchor="middle" fill={T.chartTextMuted} fontSize={10} fontWeight="500">{points[i].label}</text>)}
      </svg>
    </div>
  );
};
