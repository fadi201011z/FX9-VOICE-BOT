// ── /pause ────────────────────────────────────────────────────────────
const { SlashCommandBuilder } = require("discord.js");
const devReply = require("../utils/devReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("إيقاف مؤقت أو استكمال الموسيقى (قيد التطوير)"),
  async execute(interaction) { return devReply(interaction); },
};
