require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const { fetchMessages } = require("./script");
const { categorizeMessages } = require("./openai");

const app = express();
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

async function run() {
  console.log("🚀 Starting LinkedIn message automation...");

  try {
    await fetchMessages();

    await categorizeMessages();
  } catch (err) {
    console.error("❌ Error in automation process:", err);
  } finally {
    console.log("✅ Task completed!");
  }
}

run();

app.get("/", (req, res) => {
  res.send("LinkedIn Message Organizer is Running 🚀");
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
