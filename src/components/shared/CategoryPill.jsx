export default function CategoryPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-full font-label text-sm font-semibold whitespace-nowrap transition-colors active:scale-95 ${
        active
          ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
          : "bg-surface-low dark:bg-surface-low text-on-surface-variant hover:bg-surface-high dark:hover:bg-surface-container border border-outline-variant/20"
      }`}
    >
      {label}
    </button>
  );
}
