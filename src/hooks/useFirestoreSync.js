import { useEffect, useRef, useState } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import { STORAGE_KEY, encryptLS, decryptLS } from "../utils/storage.js";
import { emptyData } from "../utils/data.js";
import { normalizeData } from "../lib/normalizeData.js";
import { rememberSnapshot } from "../lib/dataIO.js";
import { DEFAULT_INCOME_CATS, DEFAULT_EXPENSE_CATS } from "../utils/categories.js";

// Firestore ist die Single Source of Truth. Beim Login wird IMMER zuerst der
// Firestore-Stand geladen. Lokale Daten dienen nur als Offline-Fallback.
//
// Grundregel: Es wird NIE nach Firestore geschrieben, solange kein echter
// Server-Snapshot bestätigt hat, was dort steht. Jeder Zweig, der Daten ohne
// diese Bestätigung setzt, blockt den nächsten Write über `skipNextSync`.
//
// syncStatus: "connecting" | "synced" | "offline" | "error" | "quota"

// Firestore erlaubt 1 MiB pro Dokument. Gemessen wird in BYTES, nicht in
// Zeichen: ein Umlaut belegt in UTF-8 zwei Bytes, ein Emoji vier. `.length`
// würde die Grenze deshalb zu spät ziehen.
const DOC_MAX_BYTES = 900_000;
const byteLength = (text) => new TextEncoder().encode(text).length;

// Fehler, bei denen der Listener nur die Verbindung verloren hat — alles
// andere (permission-denied, unauthenticated, ...) ist ein echter Fehler und
// darf nicht als „offline" verharmlost werden.
const OFFLINE_CODES = ["unavailable", "deadline-exceeded", "cancelled", "aborted"];
const isOfflineError = (err) => OFFLINE_CODES.includes(err && err.code);

const freshData = () => {
  const fresh = emptyData();
  fresh.categories = { income: [...DEFAULT_INCOME_CATS], expense: [...DEFAULT_EXPENSE_CATS] };
  return fresh;
};

const readLocalCache = async (localKey) => {
  try {
    const raw = localStorage.getItem(localKey);
    if (!raw) return null;
    const plain = await decryptLS(raw);
    return plain ? JSON.parse(plain) : null;
  } catch { return null; }
};

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
      // Firestore liefert nach jedem eigenen Write sofort einen Cache-Snapshot
      // (Latency Compensation). Der ist kein Offline-Zustand — sonst blinkte
      // die Anzeige nach jeder Buchung kurz auf "Offline".
      const pendingLocalWrite = snap.metadata.hasPendingWrites;
      const fromCache = snap.metadata.fromCache && !pendingLocalWrite;
      if (snap.exists()) {
        const snapData = snap.data();
        const remote = snapData.data;
        const remoteUpdatedAt = snapData.updatedAt || null;
        let parsed = null;
        if (typeof remote === "string") {
          // Ein defekter JSON-String darf nicht die ganze Ladekette abbrechen:
          // ohne den Guard bliebe dataReady false und die App hinge dauerhaft
          // im Ladebildschirm, ohne UI zum Zurücksetzen.
          try { parsed = JSON.parse(remote); } catch (err) { console.error("[Money Maker] Cloud-Daten unlesbar:", err); }
        } else if (remote && typeof remote === "object") {
          parsed = remote;
        }

        if (parsed) {
          const next = normalizeData(parsed);
          remoteTimestamp.current = remoteUpdatedAt;
          skipNextSync.current = true;
          setData(next);
          encryptLS(JSON.stringify({ _ts: remoteUpdatedAt, ...next }))
            .then(enc => localStorage.setItem(userLocalKey, enc))
            .catch(() => {});
          setSyncStatus(fromCache ? "offline" : "synced");
        } else {
          // Dokument da, Inhalt unbrauchbar → beim ersten Laden mit
          // Standarddaten starten, aber nichts zurückschreiben, solange
          // unklar ist, was dort liegt.
          if (!initialLoadDone.current) {
            skipNextSync.current = true;
            setData(freshData());
          }
          setSyncStatus("error");
        }
      } else {
        if (!initialLoadDone.current) {
          // Nur ein Server-Snapshot beweist, dass es keine Daten gibt. Kommt das
          // „existiert nicht" aus dem lokalen Cache, wäre ein Write ein blindes
          // Überschreiben des Cloud-Bestands.
          if (snap.metadata.fromCache) skipNextSync.current = true;
          setData(freshData());
          remoteTimestamp.current = null;
        }
        setSyncStatus(fromCache ? "offline" : "synced");
      }
      initialLoadDone.current = true;
      firestoreLoaded.current = true;
      setDataReady(true);
    }, async (err) => {
      console.error("[Money Maker] Firestore-Listener beendet:", err);
      if (!initialLoadDone.current) {
        // Der Listener ist gestorben, bevor wir den Cloud-Stand kennen. Der
        // Fallback darf deshalb nur anzeigen, niemals schreiben.
        skipNextSync.current = true;
        const local = await readLocalCache(userLocalKey);
        if (local) {
          const { _ts, ...rest } = local;
          remoteTimestamp.current = _ts || null;
          setData(normalizeData(rest));
        } else {
          setData(freshData());
        }
        initialLoadDone.current = true;
      }
      firestoreLoaded.current = true;
      setDataReady(true);
      setSyncStatus(isOfflineError(err) ? "offline" : "error");
    });
    return unsub;
  }, [userId]);

  // ─── Save to Firestore + localStorage on data change ─────
  useEffect(() => {
    if (!data || !userId || !firestoreLoaded.current) return;
    // Rettungsanker für die ErrorBoundary: überlebt den Absturz der Komponente.
    rememberSnapshot(data);
    const userLocalKey = STORAGE_KEY + "_" + userId;
    const nowIso = new Date().toISOString();
    encryptLS(JSON.stringify({ _ts: nowIso, ...data }))
      .then(enc => localStorage.setItem(userLocalKey, enc))
      .catch(() => {});
    if (skipNextSync.current) { skipNextSync.current = false; return; }
    // Debounce Firestore writes (500ms)
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      const payload = JSON.stringify(data);
      const size = byteLength(payload);
      if (size > DOC_MAX_BYTES) {
        // Ohne diesen Guard liefe der Write in einen Fehler, der bisher als
        // „offline" angezeigt wurde — man hätte monatelang nicht gemerkt,
        // dass nichts mehr in der Cloud landet.
        console.error("[Money Maker] Datensatz zu groß für Firestore:", size, "Bytes");
        setSyncStatus("quota");
        return;
      }
      const updatedAt = new Date().toISOString();
      setDoc(doc(db, "budgets", userId), { data: payload, updatedAt }, { merge: true })
        .then(() => { remoteTimestamp.current = updatedAt; setSyncStatus("synced"); })
        .catch((err) => {
          console.error("[Money Maker] Speichern fehlgeschlagen:", err);
          setSyncStatus(isOfflineError(err) ? "offline" : "error");
        });
    }, 500);
    return () => clearTimeout(saveTimeout.current);
  }, [data, userId]);

  return { data, setData, dataReady, syncStatus };
}
