export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-on-surface/30 dark:bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative w-full sm:max-w-md bg-surface-lowest dark:bg-surface-high rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle (mobile) */}
        <div className="flex justify-center mb-4 sm:hidden">
          <div className="w-10 h-1 bg-outline-variant rounded-full" />
        </div>

        {title && (
          <h2 className="font-headline font-bold text-xl text-on-surface mb-6">
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
}
