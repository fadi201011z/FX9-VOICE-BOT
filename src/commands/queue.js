// ── /queue ────────────────────────────────────────────────────────────
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const devReply = require("../utils/devReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("عرض قائمة التشغيل")
    .addIntegerOption(o => o.setName("page").setDescription("رقم الصفحة").setMinValue(1)),

  async execute(interaction) { return devReply(interaction); },
};
