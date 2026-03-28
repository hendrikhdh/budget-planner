export default function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-full shadow-[0_12px_32px_rgba(5,70,237,0.3)] dark:shadow-[0_12px_32px_rgba(99,99,238,0.3)] flex items-center justify-center active:scale-90 transition-all z-40 hover:shadow-xl"
    >
      <span className="material-symbols-outlined text-3xl">add</span>
    </button>
  );
}
