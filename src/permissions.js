// ── Permission System ─────────────────────────────────────────────────
// Defines who can use each command and provides runtime checks.

const { AUTHORIZED_SETUP_IDS } = require("./config");

const LEVELS = {
  EVERYONE:   0,  // كل المستخدمين
  VC_MEMBER:  1,  // يجب أن يكون في قناة صوتية
  MODERATOR:  2,  // يملك صلاحية ManageChannels
  ADMIN:      3,  // يملك صلاحية ManageGuild / Administrator
  BOT_OWNER:  4,  // في قائمة AUTHORIZED_SETUP_IDS فقط
};

// Command permission map
const COMMANDS = {
  help:       { level: LEVELS.EVERYONE,  icon: "📖", label: "الجميع",                   category: "عام" },
  ping:       { level: LEVELS.EVERYONE,  icon: "🏓", label: "الجميع",                   category: "عام" },
  setup:      { level: LEVELS.BOT_OWNER, icon: "⚙️", label: "مالك البوت والمطور فقط", category: "إعداد" },
  play:       { level: LEVELS.VC_MEMBER, icon: "🎵", label: "أعضاء القناة الصوتية",     category: "موسيقى" },
  search:     { level: LEVELS.VC_MEMBER, icon: "🔍", label: "أعضاء القناة الصوتية",     category: "موسيقى" },
  pause:      { level: LEVELS.VC_MEMBER, icon: "⏸️", label: "أعضاء القناة الصوتية",     category: "موسيقى" },
  skip:       { level: LEVELS.VC_MEMBER, icon: "⏭️", label: "أعضاء القناة الصوتية",     category: "موسيقى" },
  stop:       { level: LEVELS.VC_MEMBER, icon: "⏹️", label: "أعضاء القناة الصوتية",     category: "موسيقى" },
  volume:     { level: LEVELS.VC_MEMBER, icon: "🔊", label: "أعضاء القناة الصوتية",     category: "موسيقى" },
  loop:       { level: LEVELS.VC_MEMBER, icon: "🔁", label: "أعضاء القناة الصوتية",     category: "موسيقى" },
  queue:      { level: LEVELS.EVERYONE,  icon: "📋", label: "الجميع",                   category: "موسيقى" },
  nowplaying: { level: LEVELS.EVERYONE,  icon: "▶️", label: "الجميع",                   category: "موسيقى" },
  shuffle:    { level: LEVELS.VC_MEMBER, icon: "🔀", label: "أعضاء القناة الصوتية",     category: "موسيقى" },
  remove:     { level: LEVELS.VC_MEMBER, icon: "🗑️", label: "أعضاء القناة الصوتية",     category: "موسيقى" },
  clearqueue: { level: LEVELS.VC_MEMBER, icon: "🧹", label: "أعضاء القناة الصوتية",     category: "موسيقى" },
};

// ── Runtime Check ─────────────────────────────────────────────────────
function check(interaction, commandName) {
  const perm = COMMANDS[commandName];
  if (!perm) return { allowed: true };

  switch (perm.level) {
    case LEVELS.EVERYONE:
      return { allowed: true };

    case LEVELS.VC_MEMBER:
      return {
        allowed: !!interaction.member.voice.channel,
        reason:  "❌ يجب أن تكون في قناة صوتية لاستخدام هذا الأمر.",
      };

    case LEVELS.MODERATOR:
      return {
        allowed: interaction.member.permissions.has("ManageChannels"),
        reason:  "❌ يجب أن تملك صلاحية **إدارة القنوات** لاستخدام هذا الأمر.",
      };

    case LEVELS.ADMIN:
      return {
        allowed: interaction.member.permissions.has("ManageGuild") ||
                 interaction.member.permissions.has("Administrator"),
        reason:  "❌ يجب أن تملك صلاحية **إدارة السيرفر** لاستخدام هذا الأمر.",
      };

    case LEVELS.BOT_OWNER:
      return {
        allowed: AUTHORIZED_SETUP_IDS.includes(interaction.user.id),
        reason:  "❌ هذا الأمر مخصص لمالك البوت والمطور فقط.",
      };

    default:
      return { allowed: false, reason: "❌ لا تملك صلاحية استخدام هذا الأمر." };
  }
}

module.exports = { LEVELS, COMMANDS, check };
