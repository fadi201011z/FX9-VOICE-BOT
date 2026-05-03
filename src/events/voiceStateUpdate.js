// ── Voice State Update ────────────────────────────────────────────────
const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const autoDelete = require("../utils/autoDelete");

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState, client) {
    const {
      getGuildSetup, registerChannel, getChannel, deleteChannel,
      refreshPanel,
    } = require("../handlers/tempVoice");
    const { resetIdleTimer } = require("../handlers/music");

    const guild = newState.guild || oldState.guild;
    const setup = getGuildSetup(guild.id);

    // ── Auto-idle disconnect for music ────────────────────────────────
    if (oldState.channelId) {
      const queue = client.musicQueues.get(guild.id);
      if (queue && oldState.channelId === queue.voiceChannelId) {
        const vc     = guild.channels.cache.get(queue.voiceChannelId);
        const humans = vc?.members.filter(m => !m.user.bot).size ?? 0;
        if (humans === 0) resetIdleTimer(client, guild.id);
      }
    }

    if (!setup) return;

    // ── Member joined Join-to-Create channel ──────────────────────────
    if (newState.channelId === setup.joinChannelId) {
      const member = newState.member;
      if (member.user.bot) return;

      try {
        const vc = await guild.channels.create({
          name:   `🔊 ${member.displayName}`,
          type:   ChannelType.GuildVoice,
          parent: setup.categoryId,
          permissionOverwrites: [
            {
              id:   guild.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny:  [PermissionFlagsBits.Connect],
            },
            {
              id:    member.id,
              allow: [
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.Stream,
              ],
            },
            {
              id:    client.user.id,
              allow: [
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.MoveMembers,
              ],
            },
          ],
        });

        await member.voice.setChannel(vc).catch(() => {});

        // Register channel — NO separate panel message per VC
        registerChannel(vc.id, {
          ownerId:       member.id,
          guildId:       guild.id,
          textChannelId: setup.textChannelId,
        });

        // Update the ONE permanent panel with new active count
        await refreshPanel(client, guild.id);

        console.log(`[TempVC] ✅ Created "${vc.name}" for ${member.user.tag}`);
      } catch (err) {
        console.error("[TempVC] ❌ Create error:", err.message);
      }
      return;
    }

    // ── Member left a temp VC ─────────────────────────────────────────
    if (!oldState.channelId || oldState.channelId === setup.joinChannelId) return;

    const chData = getChannel(oldState.channelId);
    if (!chData) return;

    const vc = guild.channels.cache.get(oldState.channelId);

    // Empty → delete channel
    if (!vc || vc.members.size === 0) {
      try {
        if (vc) await vc.delete("Empty temp VC").catch(() => {});
        deleteChannel(oldState.channelId);
        // Update permanent panel with new count
        await refreshPanel(client, guild.id);
        console.log(`[TempVC] 🗑️ Deleted: ${oldState.channelId}`);
      } catch (err) {
        console.error("[TempVC] ❌ Delete error:", err.message);
      }
      return;
    }

    // Owner left → transfer to next non-bot member automatically
    if (chData.ownerId === oldState.member?.id) {
      const newOwner = vc.members.filter(m => !m.user.bot).first();
      if (newOwner) {
        chData.ownerId = newOwner.id;
        const textCh = guild.channels.cache.get(chData.textChannelId);
        if (textCh) {
          const msg = await textCh.send({
            embeds: [
              new EmbedBuilder()
                .setDescription(`👑 انتقلت ملكية **${vc.name}** إلى <@${newOwner.id}> تلقائياً`)
                .setColor(0xfee75c)
                .setFooter({ text: "تُحذف هذه الرسالة خلال 20 ثانية" }),
            ],
          }).catch(() => null);
          autoDelete(msg, 20);
        }
        console.log(`[TempVC] 👑 Ownership → ${newOwner.user.tag}`);
      }
    }
  },
};
