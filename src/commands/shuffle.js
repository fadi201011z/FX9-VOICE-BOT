// ── /shuffle ──────────────────────────────────────────────────────────
const { SlashCommandBuilder } = require("discord.js");
const devReply = require("../utils/devReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("خلط قائمة التشغيل عشوائياً (قيد التطوير)"),
  async execute(interaction) { return devReply(interaction); },
};
