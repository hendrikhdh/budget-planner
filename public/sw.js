// Money Maker – Service Worker
//
// Stellt die tägliche Erinnerung, solange der Service Worker lebt. Wichtig und
// bewusst so: das System beendet einen Service Worker nach kurzer Untätigkeit,
// der setTimeout stirbt dann mit. Die App stellt ihn deshalb bei jedem Start
// und bei jedem Zurückkehren in den Vordergrund neu (useServiceWorker.js).
// Zuverlässige Zustellung im Hintergrund bräuchte Web Push mit Server-
// Gegenstelle — das kann eine reine Client-App nicht leisten.

// Alles relativ zum Scope, damit der Base-Pfad (/budget-planner/) nicht an
// mehreren Stellen fest verdrahtet ist.
const APP_URL = new URL(self.registration.scope).pathname;
const ICON_URL = `${APP_URL}icons/icon-192x192.png`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SCHEDULE_REMINDER") scheduleReminder(data.hour, data.minute);
  if (data.type === "CANCEL_REMINDER" && self._reminderTimeout) {
    clearTimeout(self._reminderTimeout);
    self._reminderTimeout = null;
  }
});

function scheduleReminder(hour, minute) {
  if (self._reminderTimeout) clearTimeout(self._reminderTimeout);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return;

  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  // Falls die Zeit heute schon vorbei ist, auf morgen verschieben
  if (next <= now) next.setDate(next.getDate() + 1);

  self._reminderTimeout = setTimeout(() => {
    self.registration.showNotification("💰 Money Maker", {
      body: "Hast du heute schon deine Einnahmen und Ausgaben eingetragen?",
      icon: ICON_URL,
      badge: ICON_URL,
      tag: "daily-reminder",
      renotify: true,
      data: { url: APP_URL },
    }).catch(() => { /* Berechtigung fehlt oder wurde entzogen */ });
    // Täglich wiederholen, solange dieser Worker lebt
    scheduleReminder(hour, minute);
  }, next.getTime() - now.getTime());
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Vorher wurde hart "/" geöffnet — unter GitHub Pages liegt die App aber
  // unter /budget-planner/.
  const target = (event.notification.data && event.notification.data.url) || APP_URL;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(target) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    })
  );
});
