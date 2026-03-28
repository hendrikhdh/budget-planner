import { useState } from "react";
import Modal from "./Modal";
import { useApp } from "../../context/AppContext";
import { uid } from "../../lib/utils";

export default function AddTransactionModal({ open, onClose }) {
  const { data, setData } = useApp();
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const categories = data?.categories?.[type] || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !amount || parseFloat(amount) <= 0) return;

    const newEntry = {
      id: uid(),
      type,
      category,
      amount: parseFloat(amount),
      description: description || category,
      date,
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      entries: [newEntry, ...prev.entries],
    }));

    // Reset form
    setCategory("");
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Neue Transaktion">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setType("expense"); setCategory(""); }}
            className={`flex-1 py-3 rounded-xl font-label font-semibold text-sm transition-all ${
              type === "expense"
                ? "bg-expense text-white"
                : "bg-surface-container dark:bg-surface-container text-on-surface-variant"
            }`}
          >
            Ausgabe
          </button>
          <button
            type="button"
            onClick={() => { setType("income"); setCategory(""); }}
            className={`flex-1 py-3 rounded-xl font-label font-semibold text-sm transition-all ${
              type === "income"
                ? "bg-income text-white"
                : "bg-surface-container dark:bg-surface-container text-on-surface-variant"
            }`}
          >
            Einnahme
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1.5 uppercase tracking-wider">
            Betrag (€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            required
            className="w-full px-4 py-3 bg-surface-container dark:bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface text-lg font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1.5 uppercase tracking-wider">
            Kategorie
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setCategory(cat.name)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all ${
                  category === cat.name
                    ? "bg-primary/10 dark:bg-primary/20 text-primary ring-1 ring-primary/30"
                    : "bg-surface-container dark:bg-surface-container text-on-surface-variant hover:bg-surface-high"
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: cat.color }}
                >
                  {cat.icon}
                </span>
                <span className="truncate w-full text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1.5 uppercase tracking-wider">
            Beschreibung
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            className="w-full px-4 py-3 bg-surface-container dark:bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1.5 uppercase tracking-wider">
            Datum
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container dark:bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-primary to-primary-dim text-on-primary rounded-xl font-bold text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all hover:shadow-xl"
        >
          Transaktion hinzufügen
        </button>
      </form>
    </Modal>
  );
}
