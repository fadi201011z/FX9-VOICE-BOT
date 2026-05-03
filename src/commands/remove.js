// ── /remove ───────────────────────────────────────────────────────────
const { SlashCommandBuilder } = require("discord.js");
const devReply = require("../utils/devReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("حذف مقطع من قائمة التشغيل (قيد التطوير)")
    .addIntegerOption(o =>
      o.setName("position").setDescription("رقم المقطع في القائمة").setMinValue(1).setRequired(true)
    ),
  async execute(interaction) { return devReply(interaction); },
};
