import { fmtWhole } from "../utils/helpers.js";

export const DonutChart = ({ data, size = 200, T }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, fontSize: 14 }}>Keine Daten</div>;
  let cum = 0;
  const r = size / 2 - 10, cx = size / 2, cy = size / 2;
  const slices = data.filter(d => d.value > 0).map((d) => {
    const pct = d.value / total;
    const sa = cum * 2 * Math.PI - Math.PI / 2;
    cum += pct;
    const ea = cum * 2 * Math.PI - Math.PI / 2;
    const midAngle = (sa + ea) / 2;
    return { ...d, pct, sa, ea, midAngle };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((d, i) => {
        const lg = d.pct > 0.5 ? 1 : 0;
        const x1 = cx + r * Math.cos(d.sa), y1 = cy + r * Math.sin(d.sa);
        const x2 = cx + r * Math.cos(d.ea), y2 = cy + r * Math.sin(d.ea);
        if (d.pct >= 0.999) return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={28}/>;
        return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} Z`} fill={d.color} opacity={0.85}/>;
      })}
      {slices.filter(d => d.pct >= 0.10).map((d, i) => {
        const labelR = r * 0.78;
        const lx = cx + labelR * Math.cos(d.midAngle);
        const ly = cy + labelR * Math.sin(d.midAngle);
        return <text key={`p${i}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={10} fontWeight="700" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>{Math.round(d.pct * 100)}%</text>;
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} fill={T.donutCenter}/>
      <text x={cx} y={cy - 6} textAnchor="middle" fill={T.chartText} fontSize={16} fontWeight="700">{fmtWhole(total)}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={T.chartTextMuted} fontSize={11}>Gesamt</text>
    </svg>
  );
};
