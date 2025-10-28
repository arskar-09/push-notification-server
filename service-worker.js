// service-worker.js
self.addEventListener('push', event => {
  let data = { title: 'TimePeek', body: '새 알림이 있습니다.' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    console.error('푸시 데이터 파싱 실패', e);
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon.png',
    badge: data.icon || '/icon.png',
    vibrate: [100, 50, 100],
    requireInteraction: false, // 유튜브처럼 자동 사라짐
    tag: 'timepeek-alert'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
