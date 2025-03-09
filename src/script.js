const puppeteer = require("puppeteer");
require("dotenv").config();
const mongoose = require("mongoose");
const Message = require("./models/message");

async function fetchMessages() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--start-maximized"],
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();
    await page.goto("https://www.linkedin.com/messaging", {
      waitUntil: "networkidle2",
    });

    // Login
    await page.waitForSelector("#username");
    await page.type("#username", process.env.LINKEDIN_EMAIL);
    await page.type("#password", process.env.LINKEDIN_PASSWORD);
    await page.click('[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("✅ Logged into LinkedIn!");

    // Scrape unread messages
    const messages = await page.evaluate(() => {
      let data = [];

      document
        .querySelectorAll("li.msg-conversation-listitem")
        .forEach((message) => {
          let sender = message
            .querySelector(".msg-conversation-listitem__participant-names")
            ?.innerText.trim();
          let text = message
            .querySelector(".msg-conversation-card__message-snippet")
            ?.innerText.trim();
          let time = message.querySelector("time")?.getAttribute("datetime");

          let attachments = [];
          message
            .querySelectorAll(".msg-conversation-card__media-container img, a")
            .forEach((attachment) => {
              let url =
                attachment.getAttribute("href") ||
                attachment.getAttribute("src");
              let type = attachment.tagName === "IMG" ? "image" : "link";
              attachments.push({ type, url });
            });

          if (sender && text) {
            data.push({ sender, text, time, attachments });
          }
        });

      return data;
    });

    console.log(`📩 Found ${messages.length} unread messages`);

    await Message.insertMany(messages);
    console.log("✅ Messages saved to MongoDB!");
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
  } finally {
    await browser.close();
  }
}

module.exports = { fetchMessages };
