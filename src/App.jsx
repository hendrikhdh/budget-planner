import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import TopAppBar from "./components/layout/TopAppBar";
import BottomNav from "./components/layout/BottomNav";
import FAB from "./components/layout/FAB";
import AddTransactionModal from "./components/shared/AddTransactionModal";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import LimitsPage from "./pages/LimitsPage";
import StatsPage from "./pages/StatsPage";

function AppContent() {
  const { userId, authReady, dataReady } = useApp();
  const [page, setPage] = useState("home");
  const [showAddModal, setShowAddModal] = useState(false);

  // Loading state
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="material-symbols-outlined text-primary text-3xl">
              account_balance_wallet
            </span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">
            Laden...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!userId) {
    return <LoginPage />;
  }

  // Waiting for data
  if (!dataReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="material-symbols-outlined text-primary text-3xl">
              sync
            </span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">
            Daten werden geladen...
          </p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "home":
        return <DashboardPage />;
      case "history":
        return <HistoryPage />;
      case "limits":
        return <LimitsPage />;
      case "stats":
        return <StatsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopAppBar />

      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        {renderPage()}
      </main>

      <BottomNav activePage={page} onNavigate={setPage} />
      <FAB onClick={() => setShowAddModal(true)} />
      <AddTransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
