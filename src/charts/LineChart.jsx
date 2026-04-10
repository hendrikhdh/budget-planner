import { fmtShort } from "../utils/helpers.js";

export const LineChart = ({ points, color = "#00f0ff", height = 240, T }) => {
  const w = 500, h = 200, padX = 30, padTop = 28, padBot = 30;
  const chartH = h - padTop - padBot;
  if (points.length < 2) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, fontSize: 13 }}>Nicht genug Daten</div>;
  const maxV = Math.max(...points.map(p => p.v), 1);
  const coords = points.map((p, i) => ({
    x: padX + (i / (points.length - 1)) * (w - padX * 2),
    y: padTop + chartH - (p.v / maxV) * chartH
  }));
  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaD = pathD + ` L ${coords[coords.length - 1].x} ${padTop + chartH} L ${coords[0].x} ${padTop + chartH} Z`;
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
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round"/>
        {coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={4} fill={color} stroke={T.donutCenter} strokeWidth={1.5}/>)}
        {coords.map((c, i) => points[i].v > 0 && <text key={`v${i}`} x={c.x} y={c.y - 10} textAnchor="middle" fill={T.chartText} fontSize={11} fontWeight="700">{fmtShort(points[i].v)}</text>)}
        {coords.map((c, i) => <text key={`t${i}`} x={c.x} y={h - 6} textAnchor="middle" fill={T.chartTextMuted} fontSize={10} fontWeight="500">{points[i].label}</text>)}
      </svg>
    </div>
  );
};
