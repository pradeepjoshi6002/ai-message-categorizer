const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  time: String,
  attachments: [{ type: String, url: String }],
  category: { type: String, default: "Uncategorized" },
});

module.exports = mongoose.model("Message", messageSchema);
