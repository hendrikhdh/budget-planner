import { useState, useEffect, useRef } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { encryptLS, decryptLS } from "../lib/encryption";
import { STORAGE_KEY, emptyData } from "../data/defaults";

export function useFirestore(userId) {
  const [data, setData] = useState(null);
  const [dataReady, setDataReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState("connecting");

  const firestoreLoaded = useRef(false);
  const skipNextSync = useRef(false);
  const remoteTimestamp = useRef(null);
  const initialLoadDone = useRef(false);
  const saveTimeout = useRef(null);

  // Firestore realtime listener
  useEffect(() => {
    if (!userId) {
      setDataReady(false);
      firestoreLoaded.current = false;
      initialLoadDone.current = false;
      remoteTimestamp.current = null;
      return;
    }

    const userLocalKey = STORAGE_KEY + "_" + userId;
    const docRef = doc(db, "budgets", userId);

    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const snapData = snap.data();
          const remote = snapData.data;
          const remoteUpdatedAt = snapData.updatedAt || null;
          if (remote) {
            const parsed =
              typeof remote === "string" ? JSON.parse(remote) : remote;
            remoteTimestamp.current = remoteUpdatedAt;
            skipNextSync.current = true;
            setData({ ...emptyData(), ...parsed, budgets: parsed.budgets || {} });
            encryptLS(JSON.stringify({ _ts: remoteUpdatedAt, ...parsed }))
              .then((enc) => localStorage.setItem(userLocalKey, enc))
              .catch(() => {});
          }
        } else {
          if (!initialLoadDone.current) {
            setData(emptyData());
            remoteTimestamp.current = null;
          }
        }
        initialLoadDone.current = true;
        firestoreLoaded.current = true;
        setDataReady(true);
        setSyncStatus("synced");
      },
      async () => {
        // Offline fallback
        if (!initialLoadDone.current) {
          const local = await (async () => {
            try {
              const r = localStorage.getItem(userLocalKey);
              if (!r) return null;
              const plain = await decryptLS(r);
              return plain ? JSON.parse(plain) : null;
            } catch {
              return null;
            }
          })();
          if (local) {
            const { _ts, ...rest } = local;
            remoteTimestamp.current = _ts || null;
            setData({ ...emptyData(), ...rest });
          } else {
            setData(emptyData());
          }
          initialLoadDone.current = true;
        }
        firestoreLoaded.current = true;
        setDataReady(true);
        setSyncStatus("offline");
      }
    );

    return unsub;
  }, [userId]);

  // Save to Firestore + localStorage on data change
  useEffect(() => {
    if (!data || !userId || !firestoreLoaded.current) return;
    const userLocalKey = STORAGE_KEY + "_" + userId;
    const nowIso = new Date().toISOString();

    encryptLS(JSON.stringify({ _ts: nowIso, ...data }))
      .then((enc) => localStorage.setItem(userLocalKey, enc))
      .catch(() => {});

    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      const docRef = doc(db, "budgets", userId);
      const updatedAt = new Date().toISOString();
      setDoc(docRef, { data: JSON.stringify(data), updatedAt }, { merge: true })
        .then(() => {
          remoteTimestamp.current = updatedAt;
          setSyncStatus("synced");
        })
        .catch(() => setSyncStatus("offline"));
    }, 500);

    return () => clearTimeout(saveTimeout.current);
  }, [data, userId]);

  return { data, setData, dataReady, syncStatus };
}
