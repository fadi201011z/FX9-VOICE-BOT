// ── /nowplaying ───────────────────────────────────────────────────────
const { SlashCommandBuilder } = require("discord.js");
const devReply = require("../utils/devReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("عرض المقطع الحالي (قيد التطوير)"),
  async execute(interaction) { return devReply(interaction); },
};
