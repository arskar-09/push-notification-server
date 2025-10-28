// server.js
const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());

// ====== VAPID 키 설정 ======
const PUBLIC_VAPID_KEY = 'BJI70reaMqaOyL0aXjZW-3KSfgeJA2IbACMi1SgT_36V5OXWVjlZYV32wVQuioXblmTtNqR99udAv-G_muJQiqY';
const PRIVATE_VAPID_KEY = 'htB_RCqj8_7Aojr0V1sdT5AqbKD2ySXC_AJybfoRGHQ';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

// ====== 메모리 내 데이터 (배포 시 DB 권장) ======
const subscriptions = [];
const scheduledMessages = [];

// ====== 구독 등록 ======
app.post('/subscribe', (req, res) => {
  const sub = req.body;
  if (!subscriptions.find(s => JSON.stringify(s) === JSON.stringify(sub))) {
    subscriptions.push(sub);
  }
  console.log('✅ 구독 등록됨:', subscriptions.length);
  res.sendStatus(201);
});

// ====== 예약 등록 ======
app.post('/schedule', (req, res) => {
  const { message, timestamp } = req.body;
  if (!message || !timestamp) return res.status(400).json({ error: 'message와 timestamp 필요' });
  scheduledMessages.push({ message, timestamp });
  console.log('🕒 예약 추가:', message, new Date(timestamp).toLocaleString());
  res.sendStatus(201);
});

// ====== 1분마다 예약 체크 ======
cron.schedule('* * * * *', () => {
  const now = Date.now();
  for (let i = scheduledMessages.length - 1; i >= 0; i--) {
    const item = scheduledMessages[i];
    if (item.timestamp <= now) {
      subscriptions.forEach(sub => {
        webpush.sendNotification(sub, JSON.stringify({
          title: 'TimePeek 알림',
          body: item.message,
          icon: '/icon.png'
        })).catch(console.error);
      });
      console.log('📢 알림 전송됨:', item.message);
      scheduledMessages.splice(i, 1);
    }
  }
});

app.get('/', (req, res) => res.send('Push server running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
