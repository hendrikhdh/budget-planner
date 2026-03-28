import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { STORAGE_KEY } from "../data/defaults";

export function useAuth() {
  const [userId, setUserId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setUserInfo({
          name: user.displayName || "User",
          email: user.email,
          photo: user.photoURL,
        });
      } else {
        setUserId(null);
        setUserInfo(null);
      }
      setAuthReady(true);
    });
    getRedirectResult(auth).catch(() => {});
    return unsub;
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (
        err.code === "auth/popup-blocked" ||
        err.code === "auth/popup-closed-by-user"
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch {
          setLoginError("Anmeldung fehlgeschlagen. Bitte versuche es erneut.");
        }
      } else if (err.code === "auth/cancelled-popup-request") {
        // User cancelled
      } else {
        setLoginError(
          "Anmeldung fehlgeschlagen: " + (err.message || "Unbekannter Fehler")
        );
      }
    }
  };

  const handleLogout = async () => {
    if (userId) {
      try {
        localStorage.removeItem(STORAGE_KEY + "_" + userId);
      } catch {}
    }
    await signOut(auth);
    setUserId(null);
    setUserInfo(null);
  };

  return { userId, userInfo, authReady, loginError, handleLogin, handleLogout };
}
