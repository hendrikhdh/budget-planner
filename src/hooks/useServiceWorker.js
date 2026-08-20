import { useEffect, useState } from "react";

// Der Service Worker liegt neben der App, nicht im Root. Der bisherige
// absolute Pfad "/sw.js" lief unter GitHub Pages (Base /budget-planner/) in
// einen 404, den das .catch() verschluckt hat — der Worker war in Produktion
// nie registriert und die Erinnerung damit funktionslos.
const SW_URL = `${import.meta.env.BASE_URL}sw.js`;

// Registers the service worker and keeps the daily-reminder schedule in sync
// with the user's settings.
export function useServiceWorker(settings) {
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;
    let cancelled = false;
    navigator.serviceWorker.register(SW_URL, { scope: import.meta.env.BASE_URL })
      // Auf `ready` warten: erst danach gibt es sicher einen aktiven Worker,
      // an den sich überhaupt eine Nachricht schicken lässt.
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => { if (!cancelled) setRegistration(reg); })
      .catch((err) => console.error("[Money Maker] Service Worker nicht registriert:", err));
    return () => { cancelled = true; };
  }, []);

  const reminderEnabled = settings && settings.reminderEnabled;
  const reminderTime = settings && settings.reminderTime;

  useEffect(() => {
    const worker = registration && (registration.active || navigator.serviceWorker.controller);
    if (!worker) return undefined;

    const send = () => {
      if (reminderEnabled) {
        const [hour, minute] = (reminderTime || "08:00").split(":").map(Number);
        worker.postMessage({ type: "SCHEDULE_REMINDER", hour, minute });
      } else {
        worker.postMessage({ type: "CANCEL_REMINDER" });
      }
    };
    send();

    // Das System beendet untätige Service Worker; der Timer stirbt mit. Beim
    // Zurückkehren in die App wird er deshalb neu gestellt. Das ist die
    // ehrliche Obergrenze ohne Push-Dienst.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") send();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [registration, reminderEnabled, reminderTime]);
}
