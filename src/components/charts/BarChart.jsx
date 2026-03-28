const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const BAR_COLORS = [
  "bg-tertiary",
  "bg-secondary-dim dark:bg-secondary-dim",
  "bg-primary",
  "bg-tertiary",
  "bg-primary",
  "bg-secondary",
  "bg-tertiary-dim",
];

export default function BarChart({ data = [] }) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="flex items-end justify-between h-48 gap-3">
      {DAYS.map((day, i) => {
        const value = data[i]?.amount || 0;
        const heightPct = Math.max((value / max) * 100, 5);

        return (
          <div key={day} className="flex-1 flex flex-col items-center gap-4">
            <div className="w-full bg-surface-highest dark:bg-surface-highest rounded-full relative overflow-hidden"
              style={{ height: `${heightPct}%`, minHeight: "8px" }}
            >
              <div
                className={`absolute bottom-0 w-full rounded-full opacity-80 ${BAR_COLORS[i]}`}
                style={{ height: "100%" }}
              />
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              {day}
            </span>
          </div>
        );
      })}
    </div>
  );
}
