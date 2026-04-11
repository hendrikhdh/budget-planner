import { useState, useMemo } from "react";
import { EntryItem } from "../components/EntryItem.jsx";
import { SwipeToDelete } from "../components/SwipeToDelete.jsx";
import { catName, sortCategoriesByUsage } from "../utils/categories.js";
import { fmt } from "../utils/helpers.js";

export function SearchPage({ data, openEdit, onDeleteEntry, emojiLookup, colorLookup, T, styles }) {
  const { inputStyle, selectStyle, chipStyle, glassCardStyle } = styles;
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const allCats = [...(data.categories.income || []), ...(data.categories.expense || [])];
  const sortedAllCats = sortCategoriesByUsage(allCats, data.entries, null);
  const uniqueCats = [...new Set(sortedAllCats.map(c => catName(c)))];

  const results = useMemo(() => {
    let filtered = data.entries;
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(e => (e.description || "").toLowerCase().includes(q) || (e.category || "").toLowerCase().includes(q));
    }
    if (filterType !== "all") filtered = filtered.filter(e => e.type === filterType);
    if (filterCat) filtered = filtered.filter(e => e.category === filterCat);
    if (dateFrom) filtered = filtered.filter(e => e.date >= dateFrom);
    if (dateTo) filtered = filtered.filter(e => e.date <= dateTo);
    if (sortBy === "date") filtered = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    else filtered = [...filtered].sort((a, b) => b.amount - a.amount);
    return filtered;
  }, [data.entries, query, filterType, filterCat, sortBy, dateFrom, dateTo]);

  const totalIncome = results.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = results.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Suche & Filter</h2>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Beschreibung oder Kategorie suchen..." style={{ ...inputStyle, paddingLeft: 36 }}/>
        <svg viewBox="0 0 24 24" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, fill: "none", stroke: T.textMuted, strokeWidth: 2 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setFilterType("all")} style={chipStyle(filterType === "all")}>Alle</button>
        <button onClick={() => setFilterType("income")} style={chipStyle(filterType === "income")}>Einnahmen</button>
        <button onClick={() => setFilterType("expense")} style={chipStyle(filterType === "expense")}>Ausgaben</button>
        <button onClick={() => setShowFilters(!showFilters)} style={{ ...chipStyle(showFilters), marginLeft: "auto" }}>
          {showFilters ? "Filter ▲" : "Filter ▼"}
        </button>
      </div>
      {showFilters && (
        <div style={{ ...glassCardStyle, padding: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Von</div>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Bis</div>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }}/>
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Kategorie</div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...selectStyle, padding: "6px 10px", fontSize: 12 }}>
              <option value="">Alle Kategorien</option>
              {uniqueCats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Sortierung</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setSortBy("date")} style={chipStyle(sortBy === "date")}>Datum</button>
              <button onClick={() => setSortBy("amount")} style={chipStyle(sortBy === "amount")}>Betrag</button>
            </div>
          </div>
          {(dateFrom || dateTo || filterCat) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); setFilterCat(""); }} style={{ marginTop: 8, background: "none", border: "none", color: T.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Filter zurücksetzen</button>
          )}
        </div>
      )}
      <div style={{ ...glassCardStyle, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: T.textSecondary }}>{results.length} Ergebnis{results.length !== 1 ? "se" : ""}</span>
        <span><span style={{ color: T.income, fontWeight: 600 }}>+{fmt(totalIncome)}</span> <span style={{ color: T.textMuted, margin: "0 4px" }}>|</span> <span style={{ color: T.expense, fontWeight: 600 }}>−{fmt(totalExpense)}</span></span>
      </div>
      {results.length === 0 ? (
        <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 32 }}>Keine Einträge gefunden</div>
      ) : results.slice(0, 50).map(e => (
        <SwipeToDelete key={e.id} onDelete={() => onDeleteEntry(e.id)} T={T}>
          <EntryItem e={e} onClick={() => openEdit(e)} emojiLookup={emojiLookup} colorLookup={colorLookup} T={T}/>
        </SwipeToDelete>
      ))}
      {results.length > 50 && <div style={{ color: T.textMuted, fontSize: 12, textAlign: "center", padding: 16 }}>Zeige 50 von {results.length} Ergebnissen. Nutze Filter um einzugrenzen.</div>}
    </div>
  );
}
