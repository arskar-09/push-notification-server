// server.js
const express = require("express");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const cron = require("node-cron");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // public 폴더에서 static 파일 제공

const subscriptions = [];
const scheduledMessages = [];

// 환경변수에서 VAPID 키 불러오기
const PUBLIC_VAPID_KEY = process.env.PUBLIC_VAPID_KEY;
const PRIVATE_VAPID_KEY = process.env.PRIVATE_VAPID_KEY;

// 환경변수 없으면 배포 중단 + 에러 로그
if (!PUBLIC_VAPID_KEY || !PRIVATE_VAPID_KEY) {
  console.error("❌ VAPID keys are missing! Set them in Render environment variables.");
  process.exit(1); // 서버 실행 중단
}

// VAPID 설정
webpush.setVapidDetails(
  "mailto:eunchanmun4@gmail.com",
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

// Public VAPID Key 제공 (클라이언트에서 구독 시 사용)
app.get("/public-key", (req, res) => {
  res.send(PUBLIC_VAPID_KEY);
});

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

// 모든 요청에 index.html 제공
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// 포트 설정
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
