// ── /play ─────────────────────────────────────────────────────────────
const { SlashCommandBuilder } = require("discord.js");
const devReply = require("../utils/devReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("تشغيل الموسيقى من يوتيوب (قيد التطوير)")
    .addStringOption(o =>
      o.setName("query").setDescription("اسم الأغنية أو رابط يوتيوب").setRequired(true)
    ),
  async execute(interaction) { return devReply(interaction); },
};
