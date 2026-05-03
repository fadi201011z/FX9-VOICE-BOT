// ── /clearqueue ───────────────────────────────────────────────────────
const { SlashCommandBuilder } = require("discord.js");
const devReply = require("../utils/devReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearqueue")
    .setDescription("تفريغ قائمة التشغيل (قيد التطوير)"),
  async execute(interaction) { return devReply(interaction); },
};
