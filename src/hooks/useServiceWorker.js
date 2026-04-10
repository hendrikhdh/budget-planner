import { useEffect, useRef } from "react";

// Registers the service worker and keeps daily-reminder schedule in sync
// with the user's settings.
export function useServiceWorker(settings) {
  const swRef = useRef(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(reg => {
        swRef.current = reg;
      }).catch(() => {});
    }
  }, []);

  const reminderEnabled = settings && settings.reminderEnabled;
  const reminderTime = settings && settings.reminderTime;

  useEffect(() => {
    if (!swRef.current) return;
    if (reminderEnabled) {
      const [hour, minute] = (reminderTime || "08:00").split(":").map(Number);
      swRef.current.active?.postMessage({ type: "SCHEDULE_REMINDER", hour, minute });
    } else {
      swRef.current.active?.postMessage({ type: "CANCEL_REMINDER" });
    }
  }, [reminderEnabled, reminderTime]);
}
