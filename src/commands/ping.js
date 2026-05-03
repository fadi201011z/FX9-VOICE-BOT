// ── /ping ─────────────────────────────────────────────────────────────
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("فحص سرعة استجابة البوت"),

  async execute(interaction, client) {
    const sent    = await interaction.reply({ content: "🏓 جاري القياس...", fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const ws      = client.ws.ping;
    const color   = latency < 100 ? 0x57f287 : latency < 250 ? 0xfee75c : 0xed4245;
    const bar     = latency < 100 ? "🟢" : latency < 250 ? "🟡" : "🔴";

    await interaction.editReply({
      content: null,
      embeds: [
        new EmbedBuilder()
          .setTitle("🏓 Pong!")
          .setColor(color)
          .addFields(
            { name: "📡 زمن الاستجابة", value: `${bar} \`${latency}ms\``, inline: true },
            { name: "💓 WebSocket",     value: `${bar} \`${ws}ms\``,      inline: true },
          )
          .setFooter({ text: "FX9-VOICE v3.0" })
          .setTimestamp(),
      ],
    });
  },
};
