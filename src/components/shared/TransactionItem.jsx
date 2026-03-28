import { fmt, getRelativeDate, formatTime } from "../../lib/utils";
import { getCategoryIcon, getCategoryColor } from "../../data/defaults";

export default function TransactionItem({ entry, categories }) {
  const isIncome = entry.type === "income";
  const icon = getCategoryIcon(entry.category);
  const color = getCategoryColor(entry.category, categories);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-surface-lowest dark:bg-surface-low hover:bg-surface-low dark:hover:bg-surface-container transition-all duration-300 group cursor-pointer">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <p className="font-body font-semibold text-on-surface">
            {entry.description || entry.category}
          </p>
          <p className="font-label text-xs text-on-surface-variant">
            {entry.category} • {getRelativeDate(entry.date)}
            {entry.time ? `, ${entry.time}` : ""}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-headline font-bold ${
            isIncome ? "text-income" : "text-on-surface"
          }`}
        >
          {isIncome ? "+" : "-"}
          {fmt(Math.abs(entry.amount))}
        </p>
        <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">
          {entry.status || "Gebucht"}
        </p>
      </div>
    </div>
  );
}
