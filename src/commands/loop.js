// ── /loop ─────────────────────────────────────────────────────────────
const { SlashCommandBuilder } = require("discord.js");
const devReply = require("../utils/devReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("وضع التكرار (قيد التطوير)")
    .addStringOption(o =>
      o.setName("mode").setDescription("وضع التكرار").setRequired(true).addChoices(
        { name: "🚫 بدون تكرار",    value: "none"  },
        { name: "🔂 تكرار المقطع",  value: "track" },
        { name: "🔁 تكرار القائمة", value: "queue" },
      )
    ),
  async execute(interaction) { return devReply(interaction); },
};
