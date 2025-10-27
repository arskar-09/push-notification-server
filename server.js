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

// ====== 임시 DB ======
const subscriptions = [];
const scheduledMessages = [];

// ====== 구독 등록 ======
app.post('/subscribe', (req, res) => {
  subscriptions.push(req.body);
  console.log('구독 등록됨:', req.body);
  res.sendStatus(201);
});

// ====== 알림 예약 ======
app.post('/schedule', (req, res) => {
  const { message, timestamp } = req.body;
  scheduledMessages.push({ message, timestamp });
  console.log('알림 예약됨:', message, new Date(timestamp).toLocaleString());
  res.sendStatus(201);
});

// ====== 1분마다 예약 메시지 체크 ======
cron.schedule('* * * * *', () => {
  const now = Date.now();
  for (let i = scheduledMessages.length - 1; i >= 0; i--) {
    const { message, timestamp } = scheduledMessages[i];
    if (timestamp <= now) {
      subscriptions.forEach(sub => {
        webpush.sendNotification(sub, message).catch(err => console.error('푸시 전송 실패', err));
      });
      scheduledMessages.splice(i, 1);
    }
  }
});

app.listen(3000, () => {
  console.log('서버 실행 중: http://localhost:3000');
});
