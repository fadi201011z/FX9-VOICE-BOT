// ── Music Under Development Reply ─────────────────────────────────────
const { EmbedBuilder } = require("discord.js");

module.exports = async function devReply(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("🚧 ميزة الموسيقى قيد التطوير")
    .setDescription(
      "نعمل على هذه الميزة لضمان أفضل تجربة!\n\n" +
      "**✅ المتوفر الآن:**\n" +
      "╔ 🔊 نظام القنوات الصوتية المؤقتة\n" +
      "╠ 🎛️ لوحة تحكم ذكية (كل شخص يتحكم بقناته)\n" +
      "╚ 👑 نقل الملكية تلقائي\n\n" +
      "**🔜 قريباً:**\n" +
      "╔ 🎵 تشغيل الموسيقى من يوتيوب\n" +
      "╠ 📋 إدارة قوائم التشغيل\n" +
      "╚ 🔁 وضع التكرار والخلط"
    )
    .setColor(0xfee75c)
    .setFooter({ text: "FX9-VOICE • ترقبوا الإطلاق قريباً 🎵" })
    .setTimestamp();

  if (interaction.deferred || interaction.replied) {
    return interaction.editReply({ embeds: [embed] });
  }
  return interaction.reply({ embeds: [embed], ephemeral: true });
};
