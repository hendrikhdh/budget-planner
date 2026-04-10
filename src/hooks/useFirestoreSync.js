import { useEffect, useRef, useState } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import { STORAGE_KEY, encryptLS, decryptLS } from "../utils/storage.js";
import { emptyData } from "../utils/data.js";
import { DEFAULT_INCOME_CATS, DEFAULT_EXPENSE_CATS } from "../utils/categories.js";

// Firestore ist die Single Source of Truth. Beim Login wird IMMER
// zuerst der Firestore-Stand geladen. Lokale Daten dienen nur als
// Offline-Fallback und werden NIE über neuere Remote-Daten geschrieben.
export function useFirestoreSync(userId) {
  const [data, setData] = useState(null);
  const [dataReady, setDataReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState("connecting");
  const skipNextSync = useRef(false);
  const firestoreLoaded = useRef(false);
  const remoteTimestamp = useRef(null);
  const initialLoadDone = useRef(false);
  const saveTimeout = useRef(null);

  // ─── Realtime listener ──────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setData(null);
      setDataReady(false);
      setSyncStatus("connecting");
      firestoreLoaded.current = false;
      initialLoadDone.current = false;
      remoteTimestamp.current = null;
      return;
    }
    const userLocalKey = STORAGE_KEY + "_" + userId;
    const docRef = doc(db, "budgets", userId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const snapData = snap.data();
        const remote = snapData.data;
        const remoteUpdatedAt = snapData.updatedAt || null;
        if (remote) {
          const parsed = typeof remote === "string" ? JSON.parse(remote) : remote;
          remoteTimestamp.current = remoteUpdatedAt;
          skipNextSync.current = true;
          setData({ ...emptyData(), ...parsed, budgets: parsed.budgets || {} });
          encryptLS(JSON.stringify({ _ts: remoteUpdatedAt, ...parsed }))
            .then(enc => localStorage.setItem(userLocalKey, enc))
            .catch(() => {});
        }
      } else {
        // Kein Dokument in Firestore → erster Login auf diesem Account
        if (!initialLoadDone.current) {
          const fresh = emptyData();
          fresh.categories = { income: [...DEFAULT_INCOME_CATS], expense: [...DEFAULT_EXPENSE_CATS] };
          setData(fresh);
          remoteTimestamp.current = null;
        }
      }
      initialLoadDone.current = true;
      firestoreLoaded.current = true;
      setDataReady(true);
      setSyncStatus("synced");
    }, async () => {
      // Offline → lokale Daten (verschlüsselt) laden als Fallback
      if (!initialLoadDone.current) {
        const local = await (async () => {
          try {
            const r = localStorage.getItem(userLocalKey);
            if (!r) return null;
            const plain = await decryptLS(r);
            return plain ? JSON.parse(plain) : null;
          } catch { return null; }
        })();
        if (local) {
          const { _ts, ...rest } = local;
          remoteTimestamp.current = _ts || null;
          setData({ ...emptyData(), ...rest });
        } else {
          const fresh = emptyData();
          fresh.categories = { income: [...DEFAULT_INCOME_CATS], expense: [...DEFAULT_EXPENSE_CATS] };
          setData(fresh);
        }
        initialLoadDone.current = true;
      }
      firestoreLoaded.current = true;
      setDataReady(true);
      setSyncStatus("offline");
    });
    return unsub;
  }, [userId]);

  // ─── Save to Firestore + localStorage on data change ─────
  useEffect(() => {
    if (!data || !userId || !firestoreLoaded.current) return;
    const userLocalKey = STORAGE_KEY + "_" + userId;
    const nowIso = new Date().toISOString();
    encryptLS(JSON.stringify({ _ts: nowIso, ...data }))
      .then(enc => localStorage.setItem(userLocalKey, enc))
      .catch(() => {});
    if (skipNextSync.current) { skipNextSync.current = false; return; }
    // Debounce Firestore writes (500ms)
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      const docRef = doc(db, "budgets", userId);
      const updatedAt = new Date().toISOString();
      setDoc(docRef, { data: JSON.stringify(data), updatedAt }, { merge: true })
        .then(() => { remoteTimestamp.current = updatedAt; setSyncStatus("synced"); })
        .catch(() => setSyncStatus("offline"));
    }, 500);
    return () => clearTimeout(saveTimeout.current);
  }, [data, userId]);

  return { data, setData, dataReady, syncStatus };
}
