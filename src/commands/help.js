// ── /help ─────────────────────────────────────────────────────────────
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { COMMANDS }             = require("../permissions");
const { AUTHORIZED_SETUP_IDS } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("عرض جميع الأوامر المتاحة"),

  async execute(interaction) {
    const isOwner = AUTHORIZED_SETUP_IDS.includes(interaction.user.id);

    // ── Voice Panel ──────────────────────────────────────────────────
    const vcEmbed = new EmbedBuilder()
      .setTitle("🔊 نظام القنوات الصوتية المؤقتة")
      .setColor(0x5865f2)
      .setDescription("انضم لقناة ➕ وستُنشأ قناة خاصة باسمك فوراً!")
      .addFields(
        {
          name: "⚙️ الإعداد",
          value:
            `\`/setup\`  — إعداد النظام\n` +
            `> 🔒 **الصلاحية:** ${COMMANDS.setup.label}`,
        },
        {
          name: "🎛️ أزرار لوحة التحكم",
          value: [
            "```",
            "🔒 قفل         ← يمنع الانضمام",
            "🔓 فتح         ← يسمح بالانضمام",
            "🙈 إخفاء       ← يُخفي القناة",
            "👁️ إظهار       ← يُظهر القناة",
            "👥 حد الأعضاء  ← يُحدد العدد الأقصى",
            "✏️ تسمية       ← يُغير اسم القناة",
            "👢 طرد عضو     ← يُخرج عضواً",
            "👑 نقل الملكية ← ينقل الملكية",
            "```",
            "> 🔒 **الصلاحية:** مالك القناة فقط — كل شخص يتحكم بقناته",
          ].join("\n"),
        },
        {
          name: "✨ مزايا النظام",
          value: [
            "💾 الإعدادات محفوظة — لا حاجة لإعادة `/setup` بعد الريستارت",
            "🔄 اللوحة تُستعاد وتُنظَّف تلقائياً عند الإقلاع",
            "👑 نقل الملكية تلقائياً عند خروج المالك",
            "🧹 حذف القنوات الفارغة تلقائياً",
          ].join("\n"),
        },
      );

    // ── Music (dev) ──────────────────────────────────────────────────
    const musicEmbed = new EmbedBuilder()
      .setTitle("🎵 نظام الموسيقى — قيد التطوير 🚧")
      .setColor(0xfee75c)
      .setDescription("الأوامر التالية ستكون متاحة قريباً:")
      .addFields({
        name: "📋 الأوامر القادمة  |  🔒 الصلاحية: أعضاء القناة الصوتية",
        value: [
          "`/play`        🎵 — تشغيل من يوتيوب (اسم أو رابط أو playlist)",
          "`/search`      🔍 — بحث واختيار من 5 نتائج",
          "`/pause`       ⏸️ — إيقاف مؤقت / استكمال",
          "`/skip`        ⏭️ — تخطي المقطع",
          "`/stop`        ⏹️ — إيقاف كامل وتفريغ القائمة",
          "`/volume`      🔊 — ضبط الصوت (1-150%)",
          "`/loop`        🔁 — وضع التكرار",
          "`/queue`       📋 — عرض قائمة التشغيل",
          "`/nowplaying`  ▶️ — المقطع الحالي",
          "`/shuffle`     🔀 — خلط عشوائي",
          "`/remove`      🗑️ — حذف مقطع من القائمة",
          "`/clearqueue`  🧹 — مسح القائمة كاملاً",
        ].join("\n"),
      });

    // ── General ──────────────────────────────────────────────────────
    const generalEmbed = new EmbedBuilder()
      .setTitle("⚙️ الأوامر العامة  |  🔓 الجميع")
      .setColor(0x57f287)
      .addFields({
        name: "الأوامر",
        value: [
          "`/help`  📖 — عرض هذه القائمة",
          "`/ping`  🏓 — فحص استجابة البوت",
        ].join("\n"),
      });

    // ── Footer ───────────────────────────────────────────────────────
    const footerEmbed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setDescription(
        "**📊 مستويات الصلاحيات:**\n" +
        "```\n" +
        "🔓 الجميع → 🎙️ أعضاء القناة → 👑 مالك القناة → 🔑 مشرف → 🤖 مالك البوت\n" +
        "```" +
        (isOwner ? "\n> 🤖 **أنت مالك البوت — تمتلك أعلى مستوى صلاحيات**" : "")
      )
      .setFooter({
        text: `FX9-VOICE v3.0 • ${interaction.user.username}`,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [vcEmbed, musicEmbed, generalEmbed, footerEmbed],
      ephemeral: true,
    });
  },
};
