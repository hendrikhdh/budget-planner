const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "home_app_logo" },
  { id: "history", label: "History", icon: "receipt_long" },
  { id: "limits", label: "Limits", icon: "account_balance_wallet" },
  { id: "stats", label: "Stats", icon: "insights" },
];

export default function BottomNav({ activePage, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 w-full h-24 glass-nav flex justify-around items-center px-4 pb-4 rounded-t-[3rem] shadow-[0_-12px_32px_rgba(44,42,81,0.06)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50">
      {NAV_ITEMS.map((item) => {
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center px-5 py-2 rounded-full transition-all duration-300 active:scale-90 ${
              isActive
                ? "bg-surface-low dark:bg-primary/10 text-primary"
                : "text-outline-variant dark:text-on-surface-variant/60 hover:text-secondary"
            }`}
          >
            <span
              className={`material-symbols-outlined mb-1 ${isActive ? "filled" : ""}`}
            >
              {item.icon}
            </span>
            <span className="font-headline text-[10px] font-semibold uppercase tracking-widest">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
