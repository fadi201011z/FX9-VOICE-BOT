// ── /volume ───────────────────────────────────────────────────────────
const { SlashCommandBuilder } = require("discord.js");
const devReply = require("../utils/devReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("ضبط مستوى الصوت (قيد التطوير)")
    .addIntegerOption(o =>
      o.setName("level").setDescription("مستوى الصوت").setMinValue(1).setMaxValue(150).setRequired(true)
    ),
  async execute(interaction) { return devReply(interaction); },
};
