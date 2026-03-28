import { useApp } from "../../context/AppContext";

export default function TopAppBar() {
  const { isDark, toggleTheme, syncStatus } = useApp();

  return (
    <header className="fixed top-0 w-full z-50 glass-nav shadow-[0_12px_32px_rgba(44,42,81,0.06)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)] dark:border-b dark:border-white/5">
      <div className="flex justify-between items-center px-6 py-4 w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined text-primary text-xl">
              account_balance_wallet
            </span>
          </div>
          <span className="font-headline font-black text-primary tracking-tighter text-lg">
            Tracksy
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Status */}
          {syncStatus === "offline" && (
            <span className="text-xs font-medium text-on-surface-variant bg-surface-high px-2 py-1 rounded-full">
              Offline
            </span>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-primary hover:opacity-80 transition-opacity active:scale-95"
          >
            <span className="material-symbols-outlined">
              {isDark ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-full text-primary hover:opacity-80 transition-opacity active:scale-95">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </div>
    </header>
  );
}
