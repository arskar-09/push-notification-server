self.addEventListener('push', event => {
  const data = event.data ? event.data.text() : '예약 알림';
  event.waitUntil(
    self.registration.showNotification('알림', {
      body: data,
      icon: '/icon.png' // 실제 아이콘 파일 경로로 변경
    })
  );
});
