// server.js
const express = require("express");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const cron = require("node-cron");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const subscriptions = [];
const scheduledMessages = [];

// 환경변수에서 VAPID 키 불러오기
const PUBLIC_VAPID_KEY = process.env.PUBLIC_VAPID_KEY;
const PRIVATE_VAPID_KEY = process.env.PRIVATE_VAPID_KEY;

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

// 구독 등록
app.post("/subscribe", (req, res) => {
  subscriptions.push(req.body);
  res.status(201).json({});
});

// 알림 예약 등록
app.post("/schedule", (req, res) => {
  scheduledMessages.push(req.body); // { message, timestamp }
  res.status(201).json({ success: true });
});

// 1분마다 예약 메시지 확인
cron.schedule("* * * * *", () => {
  const now = Date.now();
  for (let i = scheduledMessages.length - 1; i >= 0; i--) {
    if (scheduledMessages[i].timestamp <= now) {
      subscriptions.forEach(sub => {
        webpush
          .sendNotification(sub, JSON.stringify({ body: scheduledMessages[i].message }))
          .catch(err => console.error("Push error:", err));
      });
      scheduledMessages.splice(i, 1);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
