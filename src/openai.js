const { OpenAI } = require("openai");
const mongoose = require("mongoose");
const Message = require("./models/message");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function categorizeMessages() {
  try {
    const messages = await Message.find({ category: "Uncategorized" });

    if (messages.length === 0) {
      console.log("✅ No uncategorized messages found.");
      return;
    }

    console.log(`🔍 Categorizing ${messages.length} messages...`);

    const categorizedMessages = await Promise.all(
      messages.map(async (message) => {
        const prompt = `Classify this LinkedIn message into one of these categories:
        - Job Inquiry (resume, job offers, interview requests)
        - Networking (greetings, catching up, social conversations)
        - Sales/Pitch (sales, business proposals, service offerings)
        - Spam (irrelevant or repetitive sales messages)
        - Other (if none of the above)
        
        Message: "${message.text}"
        Return only the category name.`;

        try {
          const response = await openai.completions.create({
            model: "gpt-4o-mini",
            prompt,
            max_tokens: 10,
            temperature: 0.2,
          });

          const category = response.choices[0].text.trim();
          return { _id: message._id, category };
        } catch (err) {
          console.error(`❌ OpenAI API Error for message ${message._id}:`, err);
          return null;
        }
      })
    );

    // Update categorized messages
    for (const msg of categorizedMessages) {
      if (msg) {
        await Message.updateOne({ _id: msg._id }, { category: msg.category });
        console.log(`📌 Categorized message as: ${msg.category}`);
      }
    }
  } catch (err) {
    console.error("❌ Error categorizing messages:", err);
  }
}

module.exports = { categorizeMessages };
