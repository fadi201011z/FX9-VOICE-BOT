// ── Permission System ─────────────────────────────────────────────────
const { AUTHORIZED_SETUP_IDS } = require("./config");

// ضع هنا أيديهات الرتبتين المسموح لهما باستخدام setup و help فقط
const SPECIAL_ROLES = [
  "1499391819899998269", // ايدي الرتبة الأولى
  "1499390834867441756"  // ايدي الرتبة الثانية
];

const LEVELS = {
  RESTRICTED: 0, // مستوى محصن (للرتب المحددة فقط)
  EVERYONE:   1, 
  VC_MEMBER:  2, 
};

const COMMANDS = {
  // الأوامر المحصورة للرتب المحددة
  help:       { level: LEVELS.RESTRICTED, icon: "📖", label: "الرتب الخاصة فقط", category: "عام" },
  setup:      { level: LEVELS.RESTRICTED, icon: "⚙️", label: "الرتب الخاصة فقط", category: "إعداد" },
  
  // بقية الأوامر
  ping:       { level: LEVELS.EVERYONE,   icon: "🏓", label: "الجميع",          category: "عام" },
  play:       { level: LEVELS.VC_MEMBER,  icon: "🎵", label: "أعضاء الصوت",     category: "موسيقى" },
  search:     { level: LEVELS.VC_MEMBER,  icon: "🔍", label: "أعضاء الصوت",     category: "موسيقى" },
  pause:      { level: LEVELS.VC_MEMBER,  icon: "⏸️", label: "أعضاء الصوت",     category: "موسيقى" },
  skip:       { level: LEVELS.VC_MEMBER,  icon: "⏭️", label: "أعضاء الصوت",     category: "موسيقى" },
  stop:       { level: LEVELS.VC_MEMBER,  icon: "⏹️", label: "أعضاء الصوت",     category: "موسيقى" },
  volume:     { level: LEVELS.VC_MEMBER,  icon: "🔊", label: "أعضاء الصوت",     category: "موسيقى" },
  loop:       { level: LEVELS.VC_MEMBER,  icon: "🔁", label: "أعضاء الصوت",     category: "موسيقى" },
  queue:      { level: LEVELS.EVERYONE,   icon: "📋", label: "الجميع",          category: "موسيقى" },
  nowplaying: { level: LEVELS.EVERYONE,   icon: "▶️", label: "الجميع",          category: "موسيقى" },
};

// ── Runtime Check ─────────────────────────────────────────────────────
function check(interaction, commandName) {
  const perm = COMMANDS[commandName];
  if (!perm) return { allowed: true };

  // 1. فحص صارم لأوامر help و setup
  if (perm.level === LEVELS.RESTRICTED) {
    const hasRole = interaction.member.roles.cache.some(role => SPECIAL_ROLES.includes(role.id));
    const isOwner = AUTHORIZED_SETUP_IDS.includes(interaction.user.id);

    if (!hasRole && !isOwner) {
      return {
        allowed: false,
        reason: "❌ عذراً، هذا الأمر (help/setup) متاح فقط للرتب الإدارية المحددة.",
      };
    }
    return { allowed: true };
  }

  // 2. فحص بقية الأوامر العادية
  switch (perm.level) {
    case LEVELS.EVERYONE:
      return { allowed: true };

    case LEVELS.VC_MEMBER:
      if (!interaction.member.voice.channel) {
        return {
          allowed: false,
          reason: "❌ يجب أن تكون في قناة صوتية لاستخدام أوامر الموسيقى.",
        };
      }
      return { allowed: true };

    default:
      return { allowed: false, reason: "❌ لا تملك صلاحية." };
  }
}

module.exports = { LEVELS, COMMANDS, check };