export const BarChart = ({ data, height = 220, T }) => {
  const maxV = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 400 ${height + 30}`} style={{ width: "100%", minWidth: 350, height: height + 30 }}>
        {data.map((d, i) => {
          const bw = 12, gap = 400 / 12, x = gap * i + gap / 2 - bw;
          const hI = (d.income / maxV) * height, hE = (d.expense / maxV) * height;
          return (
            <g key={i}>
              <rect x={x} y={height - hI} width={bw} height={hI} fill={T.income} opacity={0.7} rx={3}/>
              <rect x={x + bw + 2} y={height - hE} width={bw} height={hE} fill={T.expense} opacity={0.7} rx={3}/>
              <text x={x + bw} y={height + 16} textAnchor="middle" fill={T.chartTextMuted} fontSize={10}>{d.label}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4 }}>
        <span style={{ fontSize: 12, color: T.income }}>● Einnahmen</span>
        <span style={{ fontSize: 12, color: T.expense }}>● Ausgaben</span>
      </div>
    </div>
  );
};
