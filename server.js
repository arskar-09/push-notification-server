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

// ✅ 여기에 키 직접 삽입 (테스트용)
const PUBLIC_VAPID_KEY = "BHKY3h1Lbv-dbR5PH7i6wdWwyfW8b7tDW7df6glvDEByNGKO9g-wqqdmqcjVaofE8CU1zkPSf4Zq6uJEZhr1JLU";
const PRIVATE_VAPID_KEY = "K0wA81As-DHxpC6Q2Myn0mHpDlVodtvfztKLWV1rjZs";

webpush.setVapidDetails(
  "mailto:eunchanmun4@gmail.com",
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

// Public key 제공 (클라이언트에서 구독용)
app.get("/public-key", (req, res) => res.send(PUBLIC_VAPID_KEY));

// 구독 등록
app.post("/subscribe", (req, res) => {
  subscriptions.push(req.body);
  res.status(201).json({});
});

// 기간 예약 등록
app.post("/schedule", (req, res) => {
  const { message, startTime, endTime } = req.body;
  scheduledMessages.push({ message, startTime, endTime });
  res.status(201).json({ success: true });
});

// 1분마다 예약 메시지 확인
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
    if (now > msg.endTime) scheduledMessages.splice(i, 1);
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
