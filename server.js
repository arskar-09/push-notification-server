const express = require("express");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const cron = require("node-cron");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const subscriptions = [];
const scheduledMessages = [];

// ✅ 테스트용 하드코딩된 VAPID 키 (Render 환경변수 필요 없음)
const PUBLIC_VAPID_KEY = "BHKY3h1Lbv-dbR5PH7i6wdWwyfW8b7tDW7df6glvDEByNGKO9g-wqqdmqcjVaofE8CU1zkPSf4Zq6uJEZhr1JLU";
const PRIVATE_VAPID_KEY = "K0wA81As-DHxpC6Q2Myn0mHpDlVodtvfztKLWV1rjZs";

// ✅ VAPID 설정
webpush.setVapidDetails(
  "mailto:eunchanmun4@gmail.com",
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

// ✅ 공개키 요청 시 응답
app.get("/public-key", (req, res) => res.send(PUBLIC_VAPID_KEY));

// ✅ 구독 등록
app.post("/subscribe", (req, res) => {
  subscriptions.push(req.body);
  res.status(201).json({});
});

// ✅ 알림 예약 등록 (시작 ~ 종료 시간)
app.post("/schedule", (req, res) => {
  const { message, startTime, endTime } = req.body;
  scheduledMessages.push({ message, startTime, endTime });
  console.log(`📅 예약 등록: ${message} (${new Date(startTime)} ~ ${new Date(endTime)})`);
  res.status(201).json({ success: true });
});

// ✅ 1분마다 예약된 메시지 전송
cron.schedule("* * * * *", () => {
  const now = Date.now();
  for (let i = scheduledMessages.length - 1; i >= 0; i--) {
    const msg = scheduledMessages[i];

    if (now >= msg.startTime && now <= msg.endTime) {
      subscriptions.forEach(sub => {
        webpush
          .sendNotification(sub, JSON.stringify({ body: msg.message }))
          .catch(err => console.error("Push error:", err));
      });
    }

    if (now > msg.endTime) {
      console.log(`⏰ 예약 종료: ${msg.message}`);
      scheduledMessages.splice(i, 1);
    }
  }
});

// ✅ Express 5 호환 와일드카드 처리 (오류 해결)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
