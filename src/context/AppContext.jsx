import { createContext, useContext } from "react";
import { useAuth } from "../hooks/useAuth";
import { useFirestore } from "../hooks/useFirestore";
import { useTheme } from "../hooks/useTheme";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { userId, userInfo, authReady, loginError, handleLogin, handleLogout } =
    useAuth();
  const { data, setData, dataReady, syncStatus } = useFirestore(userId);
  const { isDark, toggleTheme } = useTheme();

  return (
    <AppContext.Provider
      value={{
        userId,
        userInfo,
        authReady,
        loginError,
        handleLogin,
        handleLogout,
        data,
        setData,
        dataReady,
        syncStatus,
        isDark,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
