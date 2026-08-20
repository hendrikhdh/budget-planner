import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { uid, getToday, parseLocalDate } from "./utils/helpers.js";
import { CAT_COLORS, catName, catEmoji, catColorVal } from "./utils/categories.js";
import { emptyData } from "./utils/data.js";

import { useTheme } from "./hooks/useTheme.js";
import { useHashRoute } from "./hooks/useHashRoute.js";
import { useAuth } from "./hooks/useAuth.js";
import { useFirestoreSync } from "./hooks/useFirestoreSync.js";
import { useServiceWorker } from "./hooks/useServiceWorker.js";
import { useApplyRecurring } from "./hooks/useApplyRecurring.js";
import { useFormStyles } from "./hooks/useFormStyles.js";

import { EntryModal } from "./components/EntryModal.jsx";
import { MoneyRain } from "./components/effects/MoneyRain.jsx";
import { UndoSnackbar } from "./components/UndoSnackbar.jsx";
import { AppHeader } from "./components/layout/AppHeader.jsx";
import { SyncBanner } from "./components/layout/SyncBanner.jsx";
import { BottomNav, SubNav, NAV_TABS } from "./components/layout/BottomNav.jsx";
import { LoginScreen } from "./components/layout/LoginScreen.jsx";
import { LoadingScreen } from "./components/layout/LoadingScreen.jsx";
import { BackgroundOrbs } from "./components/layout/BackgroundOrbs.jsx";
import { AppShellStyles } from "./components/layout/AppShellStyles.jsx";
import { ConfirmDialog, ImportMessageDialog } from "./components/layout/ConfirmDialog.jsx";

import { HomePage } from "./pages/HomePage.jsx";
import { AnalysisPage } from "./pages/AnalysisPage.jsx";
import { YearlyPage } from "./pages/YearlyPage.jsx";
import { ImportExportPage } from "./pages/ImportExportPage.jsx";
import { CategoriesPage } from "./pages/CategoriesPage.jsx";
import { RecurringPage } from "./pages/RecurringPage.jsx";
import { SavingsPage } from "./pages/SavingsPage.jsx";
import { PredictionPage } from "./pages/PredictionPage.jsx";
import { BudgetPage } from "./pages/BudgetPage.jsx";
import { SearchPage } from "./pages/SearchPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { WealthPage } from "./pages/WealthPage.jsx";

// Modul-Ebene: stabile Referenz, sonst würde sich der Routing-Effekt bei
// jedem Render neu anmelden.
const PAGE_IDS = NAV_TABS.flatMap(tab => tab.pages.map(p => p.id));

// Manifest-Shortcut "Neue Ausgabe" ruft #/home?new=1 auf. Der Wert wird einmal
// beim Initialisieren gelesen — nicht per setState im Effekt, das wäre ein
// zusätzlicher Renderdurchlauf.
const wantsNewEntry = () => {
  if (typeof window === "undefined") return false;
  const query = window.location.hash.split("?")[1] || "";
  return new URLSearchParams(query).get("new") === "1";
};

export default function BudgetPlanner() {
  const { theme, toggleTheme, T, isDark } = useTheme();
  const { userId, userInfo, authReady, loginError, login, logout } = useAuth();
  const { data, setData, dataReady, syncStatus } = useFirestoreSync(userId);
  useServiceWorker(data && data.settings);
  useApplyRecurring(data, setData);
  const styles = useFormStyles(T, isDark);

  const [viewMonth, setViewMonth] = useState(getToday().month);
  const [viewYear, setViewYear] = useState(getToday().year);
  const [page, setPage] = useHashRoute(PAGE_IDS, "home");
  const [newEntryOpen, setNewEntryOpen] = useState(wantsNewEntry);
  const [editEntry, setEditEntry] = useState(null);
  const [importMsg, setImportMsg] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [rainKey, setRainKey] = useState(0);
  const [undoEntry, setUndoEntry] = useState(null);
  const importMsgTimer = useRef(null);
  const undoToken = useRef(0);

  const balanceColor = useCallback((val) => val < 0 ? T.expense : val <= 500 ? T.warning : T.income, [T]);

  const monthEntries = useMemo(
    () => data ? data.entries.filter(e => { const d = parseLocalDate(e.date); return d.getMonth() === viewMonth && d.getFullYear() === viewYear; }) : [],
    [data && data.entries, viewMonth, viewYear]
  );
  const income = useMemo(() => monthEntries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0), [monthEntries]);
  const expense = useMemo(() => monthEntries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0), [monthEntries]);
  const balance = income - expense;

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const goToday = () => { setViewMonth(getToday().month); setViewYear(getToday().year); };

  const adjustSavingsGoals = (goals, oldEntry, newEntry) => {
    if (!goals) return goals;
    const oldGid = oldEntry && oldEntry.savingsGoalId;
    const newGid = newEntry && newEntry.savingsGoalId;
    if (!oldGid && !newGid) return goals;
    const deltas = {};
    if (oldGid) deltas[oldGid] = (deltas[oldGid] || 0) - (oldEntry.amount || 0);
    if (newGid) deltas[newGid] = (deltas[newGid] || 0) + (newEntry.amount || 0);
    return goals.map(g => deltas[g.id] ? { ...g, saved: Math.max(0, (g.saved || 0) + deltas[g.id]) } : g);
  };

  const handleSaveEntry = (entry) => {
    const isNewIncome = !entry.id && entry.type === "income" && !entry.savingsGoalId;
    setData(prev => {
      const isEdit = !!entry.id;
      const oldEntry = isEdit ? prev.entries.find(e => e.id === entry.id) : null;
      const newEntry = isEdit ? entry : { ...entry, id: uid() };
      const entries = isEdit
        ? prev.entries.map(e => e.id === entry.id ? newEntry : e)
        : [...prev.entries, newEntry];
      const savingsGoals = adjustSavingsGoals(prev.savingsGoals, oldEntry, newEntry);
      return { ...prev, entries, savingsGoals };
    });
    setNewEntryOpen(false); setEditEntry(null);
    if (isNewIncome) setRainKey(k => k + 1);
  };
  const handleDeleteEntry = (id) => {
    // Position und Eintrag werden aus dem aktuellen State gelesen, nicht im
    // Updater — der läuft im StrictMode doppelt und darf keine Seiteneffekte haben.
    const index = data ? data.entries.findIndex(e => e.id === id) : -1;
    const removed = index >= 0 ? data.entries[index] : null;
    setData(prev => {
      const oldEntry = prev.entries.find(e => e.id === id);
      const entries = prev.entries.filter(e => e.id !== id);
      const savingsGoals = adjustSavingsGoals(prev.savingsGoals, oldEntry, null);
      return { ...prev, entries, savingsGoals };
    });
    setNewEntryOpen(false); setEditEntry(null);
    if (removed) {
      undoToken.current += 1;
      setUndoEntry({ token: undoToken.current, entry: removed, index });
    }
  };

  // Setzt den Eintrag an seiner alten Position wieder ein und dreht die
  // Sparziel-Buchung mit zurück.
  const handleUndoDelete = () => {
    if (!undoEntry) return;
    const { entry, index } = undoEntry;
    setData(prev => {
      if (prev.entries.some(e => e.id === entry.id)) return prev;
      const entries = [...prev.entries];
      entries.splice(Math.min(index, entries.length), 0, entry);
      return { ...prev, entries, savingsGoals: adjustSavingsGoals(prev.savingsGoals, null, entry) };
    });
    setUndoEntry(null);
  };
  const dismissUndo = useCallback(() => setUndoEntry(null), []);
  const openEdit = (e) => { setEditEntry(e); setNewEntryOpen(true); };
  const openNewEntry = () => { setEditEntry(null); setNewEntryOpen(true); };
  const navigate = (p) => { setPage(p); };

  // Alle Seiten teilen denselben Dokument-Scrollcontainer. Ohne Reset landet
  // man beim Seitenwechsel mitten in der neuen Seite statt an ihrem Anfang.
  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  // Shortcut-Parameter aus der URL entfernen, damit ein Reload nicht erneut
  // das Eingabeformular öffnet.
  useEffect(() => {
    if (!window.location.hash.includes("?")) return;
    const cleaned = window.location.hash.split("?")[0];
    window.history.replaceState(null, "", window.location.pathname + cleaned);
  }, []);

  const showImportMsg = useCallback((msg) => {
    if (importMsgTimer.current) clearTimeout(importMsgTimer.current);
    setImportMsg(msg);
    if (msg.type === "success") {
      importMsgTimer.current = setTimeout(() => setImportMsg(null), 6000);
    }
  }, []);

  const handleReset = () => {
    setData(emptyData());
    setConfirmReset(false);
    showImportMsg({ type: "success", title: "Daten gelöscht", text: "Alle Einträge, Kategorien, Sparziele und wiederkehrende Buchungen wurden gelöscht." });
  };

  const emojiLookup = (categoryName, type, entry) => {
    if (entry && entry.savingsGoalId) {
      const g = (data.savingsGoals || []).find(g => g.id === entry.savingsGoalId);
      return (g && g.emoji) || "🎯";
    }
    const cats = type === "income" ? data.categories.income : data.categories.expense;
    const found = cats.find(c => catName(c) === categoryName);
    return found ? catEmoji(found) : "";
  };
  const colorLookup = (categoryName, type, entry) => {
    if (entry && entry.savingsGoalId) return T.warning;
    const cats = type === "income" ? data.categories.income : data.categories.expense;
    const found = cats.find(c => catName(c) === categoryName);
    return found ? catColorVal(found) : CAT_COLORS[0].hex;
  };

  const handleLogout = async () => { await logout(); };

  // ─── Routing ──────────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case "home":
        return <HomePage data={data} T={T} styles={styles} isDark={isDark}
          viewMonth={viewMonth} viewYear={viewYear} prevMonth={prevMonth} nextMonth={nextMonth} goToday={goToday}
          monthEntries={monthEntries} income={income} expense={expense} balance={balance} balanceColor={balanceColor}
          openEdit={openEdit} onDeleteEntry={handleDeleteEntry} emojiLookup={emojiLookup} colorLookup={colorLookup}
          setPage={setPage} openNewEntry={openNewEntry}/>;
      case "income-analysis":
        return <AnalysisPage type="income" data={data} T={T} styles={styles}
          viewMonth={viewMonth} viewYear={viewYear} monthEntries={monthEntries}
          prevMonth={prevMonth} nextMonth={nextMonth} goToday={goToday}
          openEdit={openEdit} emojiLookup={emojiLookup} colorLookup={colorLookup}/>;
      case "expense-analysis":
        return <AnalysisPage type="expense" data={data} T={T} styles={styles}
          viewMonth={viewMonth} viewYear={viewYear} monthEntries={monthEntries}
          prevMonth={prevMonth} nextMonth={nextMonth} goToday={goToday}
          openEdit={openEdit} emojiLookup={emojiLookup} colorLookup={colorLookup}/>;
      case "yearly":
        return <YearlyPage data={data} T={T} styles={styles}
          viewYear={viewYear} setViewYear={setViewYear} setViewMonth={setViewMonth} setPage={setPage}
          balanceColor={balanceColor}/>;
      case "import-export":
        return <ImportExportPage data={data} setData={setData} T={T} styles={styles} isDark={isDark}
          onMessage={showImportMsg} onResetRequest={() => setConfirmReset(true)}/>;
      case "budget": return <BudgetPage key="budget" data={data} setData={setData} monthEntries={monthEntries} T={T} styles={styles}/>;
      case "search": return <SearchPage key="search" data={data} openEdit={openEdit} onDeleteEntry={handleDeleteEntry} emojiLookup={emojiLookup} colorLookup={colorLookup} T={T} styles={styles}/>;
      case "categories": return <CategoriesPage key="categories" data={data} setData={setData} T={T} styles={styles}/>;
      case "recurring": return <RecurringPage key="recurring" data={data} setData={setData} T={T} styles={styles}/>;
      case "savings": return <SavingsPage key="savings" data={data} setData={setData} T={T} styles={styles}/>;
      case "prediction": return <PredictionPage key="prediction" data={data} T={T} styles={styles}/>;
      case "settings": return <SettingsPage key="settings" data={data} setData={setData} T={T} styles={styles} theme={theme} toggleTheme={toggleTheme} syncStatus={syncStatus} userInfo={userInfo} onLogout={handleLogout}/>;
      case "wealth": return <WealthPage key="wealth" data={data} setData={setData} T={T} styles={styles}/>;
      default:
        return <HomePage data={data} T={T} styles={styles} isDark={isDark}
          viewMonth={viewMonth} viewYear={viewYear} prevMonth={prevMonth} nextMonth={nextMonth} goToday={goToday}
          monthEntries={monthEntries} income={income} expense={expense} balance={balance} balanceColor={balanceColor}
          openEdit={openEdit} onDeleteEntry={handleDeleteEntry} emojiLookup={emojiLookup} colorLookup={colorLookup}
          setPage={setPage} openNewEntry={openNewEntry}/>;
    }
  };

  if (authReady && !userId) {
    return <LoginScreen T={T} isDark={isDark} loginError={loginError} onLogin={login} toggleTheme={toggleTheme}/>;
  }
  if (!authReady || (authReady && userId && !dataReady)) {
    return <LoadingScreen T={T} hasUser={!!userId}/>;
  }

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      background: T.bgGradient,
      minHeight: "100vh",
      color: T.textPrimary,
      position: "relative",
      overflow: "hidden",
      maxWidth: 520,
      margin: "0 auto",
      transition: "background .4s ease, color .3s ease"
    }}>
      <AppShellStyles T={T}/>
      <BackgroundOrbs isDark={isDark}/>

      <AppHeader T={T} isDark={isDark} onTitleClick={() => setPage("home")} pulseId={rainKey}
        syncStatus={syncStatus} onStatusClick={() => setPage("settings")}/>

      <div style={{
        paddingTop: 69,
        paddingBottom: "calc(72px + env(safe-area-inset-bottom))",
        position: "relative", zIndex: 1
      }}>
        <SyncBanner T={T} syncStatus={syncStatus}/>
        <SubNav T={T} page={page} onNavigate={navigate}/>
        {renderPage()}
      </div>

      <BottomNav T={T} isDark={isDark} page={page} onNavigate={navigate}/>

      <MoneyRain triggerId={rainKey}/>

      <UndoSnackbar T={T} token={undoEntry && undoEntry.token}
        message={undoEntry ? `${undoEntry.entry.description || undoEntry.entry.category || "Eintrag"} gelöscht` : ""}
        onUndo={handleUndoDelete} onDismiss={dismissUndo}/>

      <EntryModal open={newEntryOpen} onClose={() => { setNewEntryOpen(false); setEditEntry(null); }}
        editEntry={editEntry} onSave={handleSaveEntry} onDelete={handleDeleteEntry}
        categories={data.categories} entries={data.entries} savingsGoals={data.savingsGoals} setPage={setPage} viewMonth={viewMonth} viewYear={viewYear} T={T} styles={styles}/>

      {importMsg && <ImportMessageDialog T={T} styles={styles} msg={importMsg} onClose={() => setImportMsg(null)}/>}

      {confirmReset && (
        <ConfirmDialog T={T} styles={styles} danger
          title="Alle Daten löschen?"
          text="Einträge, Kategorien, Sparziele und wiederkehrende Buchungen werden unwiderruflich gelöscht."
          confirmLabel="Löschen"
          onConfirm={handleReset}
          onCancel={() => setConfirmReset(false)}/>
      )}
    </div>
  );
}
