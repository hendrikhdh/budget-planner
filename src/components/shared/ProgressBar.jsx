export default function ProgressBar({ value, max, color = "bg-primary", label, sublabel }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div>
      {(label || sublabel) && (
        <div className="flex justify-between text-sm mb-2">
          {label && <span className="text-on-surface-variant">{label}</span>}
          {sublabel && (
            <span className="font-bold text-on-surface">{sublabel}</span>
          )}
        </div>
      )}
      <div className="h-2 w-full bg-surface-highest dark:bg-surface-highest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
