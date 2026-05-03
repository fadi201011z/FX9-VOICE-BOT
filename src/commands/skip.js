// ── /skip ─────────────────────────────────────────────────────────────
const { SlashCommandBuilder } = require("discord.js");
const devReply = require("../utils/devReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("تخطي المقطع الحالي (قيد التطوير)"),
  async execute(interaction) { return devReply(interaction); },
};
