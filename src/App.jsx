import { useState, useMemo, useCallback, useRef } from "react";
import { uid, getToday } from "./utils/helpers.js";
import { CAT_COLORS, catName, catEmoji, catColorVal } from "./utils/categories.js";
import { emptyData } from "./utils/data.js";

import { useTheme } from "./hooks/useTheme.js";
import { useAuth } from "./hooks/useAuth.js";
import { useFirestoreSync } from "./hooks/useFirestoreSync.js";
import { useServiceWorker } from "./hooks/useServiceWorker.js";
import { useApplyRecurring } from "./hooks/useApplyRecurring.js";
import { useFormStyles } from "./hooks/useFormStyles.js";

import { EntryModal } from "./components/EntryModal.jsx";
import { AppHeader } from "./components/layout/AppHeader.jsx";
import { SideMenu } from "./components/layout/SideMenu.jsx";
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

export default function BudgetPlanner() {
  const { theme, toggleTheme, T, isDark } = useTheme();
  const { userId, userInfo, authReady, loginError, login, logout } = useAuth();
  const { data, setData, dataReady, syncStatus } = useFirestoreSync(userId);
  useServiceWorker(data && data.settings);
  useApplyRecurring(data, setData);
  const styles = useFormStyles(T, isDark);

  const [viewMonth, setViewMonth] = useState(getToday().month);
  const [viewYear, setViewYear] = useState(getToday().year);
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [importMsg, setImportMsg] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const importMsgTimer = useRef(null);

  const balanceColor = useCallback((val) => val < 0 ? T.expense : val <= 500 ? T.warning : T.income, [T]);

  const monthEntries = useMemo(
    () => data ? data.entries.filter(e => { const d = new Date(e.date); return d.getMonth() === viewMonth && d.getFullYear() === viewYear; }) : [],
    [data && data.entries, viewMonth, viewYear]
  );
  const income = useMemo(() => monthEntries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0), [monthEntries]);
  const expense = useMemo(() => monthEntries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0), [monthEntries]);
  const balance = income - expense;

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const goToday = () => { setViewMonth(getToday().month); setViewYear(getToday().year); };

  const handleSaveEntry = (entry) => {
    if (entry.id) setData(prev => ({ ...prev, entries: prev.entries.map(e => e.id === entry.id ? entry : e) }));
    else setData(prev => ({ ...prev, entries: [...prev.entries, { ...entry, id: uid() }] }));
    setNewEntryOpen(false); setEditEntry(null);
  };
  const handleDeleteEntry = (id) => {
    setData(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }));
    setNewEntryOpen(false); setEditEntry(null);
  };
  const openEdit = (e) => { setEditEntry(e); setNewEntryOpen(true); };
  const openNewEntry = () => { setEditEntry(null); setNewEntryOpen(true); };
  const navigate = (p) => { setPage(p); setMenuOpen(false); };

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

  const emojiLookup = (categoryName, type) => {
    const cats = type === "income" ? data.categories.income : data.categories.expense;
    const found = cats.find(c => catName(c) === categoryName);
    return found ? catEmoji(found) : "";
  };
  const colorLookup = (categoryName, type) => {
    const cats = type === "income" ? data.categories.income : data.categories.expense;
    const found = cats.find(c => catName(c) === categoryName);
    return found ? catColorVal(found) : CAT_COLORS[0].hex;
  };

  const handleLogout = async () => { await logout(); setMenuOpen(false); };

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
      case "settings": return <SettingsPage key="settings" data={data} setData={setData} T={T} styles={styles} theme={theme} toggleTheme={toggleTheme} syncStatus={syncStatus}/>;
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

      <AppHeader T={T} isDark={isDark}
        onMenu={() => setMenuOpen(true)} onTitleClick={() => setPage("home")}/>

      {menuOpen && (
        <SideMenu T={T} isDark={isDark} page={page} userInfo={userInfo}
          onClose={() => setMenuOpen(false)} onNavigate={navigate} onLogout={handleLogout}/>
      )}

      <div style={{ paddingTop: 69, position: "relative", zIndex: 1 }}>{renderPage()}</div>

      <EntryModal open={newEntryOpen} onClose={() => { setNewEntryOpen(false); setEditEntry(null); }}
        editEntry={editEntry} onSave={handleSaveEntry} onDelete={handleDeleteEntry}
        categories={data.categories} viewMonth={viewMonth} viewYear={viewYear} T={T} styles={styles}/>

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
