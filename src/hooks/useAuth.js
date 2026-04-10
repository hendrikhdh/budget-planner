import { useEffect, useState } from "react";
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase.js";
import { STORAGE_KEY } from "../utils/storage.js";

export function useAuth() {
  const [userId, setUserId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setUserInfo({ name: user.displayName || "User", email: user.email, photo: user.photoURL });
      } else {
        setUserId(null);
        setUserInfo(null);
      }
      setAuthReady(true);
    });
    // Check for redirect result (mobile flow)
    getRedirectResult(auth).catch(() => {});
    return unsub;
  }, []);

  const login = async () => {
    setLoginError(null);
    try {
      // Try popup first (works on desktop)
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
        // Fallback to redirect (works on mobile/iPad)
        try { await signInWithRedirect(auth, googleProvider); } catch { setLoginError("Anmeldung fehlgeschlagen. Bitte versuche es erneut."); }
      } else if (err.code === "auth/cancelled-popup-request") {
        // User cancelled, do nothing
      } else {
        setLoginError("Anmeldung fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
      }
    }
  };

  const logout = async () => {
    const uid = userId;
    await signOut(auth);
    // Lokale Daten löschen für Sicherheit auf geteilten Geräten
    if (uid) { try { localStorage.removeItem(STORAGE_KEY + "_" + uid); } catch {} }
    setUserId(null);
    setUserInfo(null);
  };

  return { userId, userInfo, authReady, loginError, login, logout };
}
