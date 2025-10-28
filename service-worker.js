self.addEventListener('push', event => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification("📢 알림", {
      body: data.body,
      icon: "/icon.png",
      badge: "/badge.png",
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [{ action: "open", title: "열기" }]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
