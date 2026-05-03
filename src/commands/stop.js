// ── /stop ─────────────────────────────────────────────────────────────
const { SlashCommandBuilder } = require("discord.js");
const devReply = require("../utils/devReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("إيقاف الموسيقى وتفريغ القائمة (قيد التطوير)"),
  async execute(interaction) { return devReply(interaction); },
};
