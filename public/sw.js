// Budget Planer – Service Worker
// Sendet täglich eine Erinnerung zur eingestellten Uhrzeit.

const CACHE_NAME = "budget-planer-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Nachricht vom Haupt-Thread empfangen: Reminder planen
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SCHEDULE_REMINDER") {
    const { hour, minute } = event.data;
    scheduleReminder(hour, minute);
  }
  if (event.data && event.data.type === "CANCEL_REMINDER") {
    if (self._reminderTimeout) clearTimeout(self._reminderTimeout);
  }
});

function scheduleReminder(hour, minute) {
  if (self._reminderTimeout) clearTimeout(self._reminderTimeout);

  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  // Falls die Zeit heute schon vorbei ist, auf morgen verschieben
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next.getTime() - now.getTime();

  self._reminderTimeout = setTimeout(() => {
    self.registration.showNotification("💰 Budget Planer", {
      body: "Hast du heute schon deine Einnahmen und Ausgaben eingetragen?",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: "daily-reminder",
      renotify: true,
      data: { url: "/" }
    });
    // Täglich wiederholen
    scheduleReminder(hour, minute);
  }, delay);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
