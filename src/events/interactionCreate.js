// ── Interaction Create ────────────────────────────────────────────────
const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {

    // ── Slash Commands ─────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction, client);
      } catch (err) {
        console.error(`[CMD] /${interaction.commandName}:`, err.message);
        const payload = { content: "❌ حدث خطأ أثناء تنفيذ الأمر.", ephemeral: true };
        interaction.replied || interaction.deferred
          ? interaction.followUp(payload)
          : interaction.reply(payload);
      }
      return;
    }

    // ── Button Interactions ────────────────────────────────────────────
    if (interaction.isButton()) {
      const id = interaction.customId;

      // ── Temp Voice Buttons ───────────────────────────────────────────
      if (id.startsWith("vc_")) {
        const { getChannelByOwner, deleteChannel } = require("../handlers/tempVoice");
        const { checkCooldown }     = require("../utils/cooldown");
        const member = interaction.member;

        // Find the temp VC owned by this user in this guild
        const owned = getChannelByOwner(interaction.guildId, member.id);
        if (!owned) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setDescription(
                "❌ **ليس لديك قناة صوتية نشطة.**\n" +
                "انضم إلى قناة ➕ لإنشاء قناتك الخاصة أولاً."
              )
              .setColor(0xed4245)],
            ephemeral: true,
          });
        }

        const vc = interaction.guild.channels.cache.get(owned.vcId);
        if (!vc) {
          // Channel no longer exists — clean up stale entry
          deleteChannel(owned.vcId);
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setDescription(
                "❌ **قناتك لم تعد موجودة.**\n" +
                "انضم إلى قناة ➕ لإنشاء قناة جديدة."
              )
              .setColor(0xed4245)],
            ephemeral: true,
          });
        }

        const rem = checkCooldown(member.id, id);
        if (rem > 0) {
          return interaction.reply({ content: `⏳ انتظر **${(rem / 1000).toFixed(1)}ث**.`, ephemeral: true });
        }

        try {
          if (id === "vc_lock") {
            await vc.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
            return interaction.reply({
              embeds: [new EmbedBuilder()
                .setDescription(`🔒 تم قفل قناتك **${vc.name}** — لا يمكن لأحد الانضمام.`)
                .setColor(0xed4245)],
              ephemeral: true,
            });
          }

          if (id === "vc_unlock") {
            await vc.permissionOverwrites.edit(interaction.guild.id, { Connect: true });
            return interaction.reply({
              embeds: [new EmbedBuilder()
                .setDescription(`🔓 تم فتح قناتك **${vc.name}** للجميع.`)
                .setColor(0x57f287)],
              ephemeral: true,
            });
          }

          if (id === "vc_hide") {
            await vc.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
            return interaction.reply({
              embeds: [new EmbedBuilder()
                .setDescription(`🙈 تم إخفاء قناتك **${vc.name}**.`)
                .setColor(0x99aab5)],
              ephemeral: true,
            });
          }

          if (id === "vc_show") {
            await vc.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: true });
            return interaction.reply({
              embeds: [new EmbedBuilder()
                .setDescription(`👁️ تم إظهار قناتك **${vc.name}**.`)
                .setColor(0x57f287)],
              ephemeral: true,
            });
          }

          if (id === "vc_limit") {
            const modal = new ModalBuilder().setCustomId("modal_vc_limit").setTitle("تحديد عدد الأعضاء");
            modal.addComponents(new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId("limit_value")
                .setLabel("العدد الأقصى (0 = بلا حدود)")
                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2)
                .setPlaceholder("مثال: 5").setRequired(true)
            ));
            return interaction.showModal(modal);
          }

          if (id === "vc_rename") {
            const modal = new ModalBuilder().setCustomId("modal_vc_rename").setTitle("تسمية القناة");
            modal.addComponents(new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId("rename_value")
                .setLabel("الاسم الجديد").setStyle(TextInputStyle.Short)
                .setMaxLength(32).setRequired(true)
            ));
            return interaction.showModal(modal);
          }

          if (id === "vc_kick") {
            const modal = new ModalBuilder().setCustomId("modal_vc_kick").setTitle("طرد عضو من القناة");
            modal.addComponents(new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId("kick_id")
                .setLabel("معرّف العضو (User ID)")
                .setStyle(TextInputStyle.Short).setMinLength(17).setMaxLength(20).setRequired(true)
            ));
            return interaction.showModal(modal);
          }

          if (id === "vc_transfer") {
            const modal = new ModalBuilder().setCustomId("modal_vc_transfer").setTitle("نقل الملكية");
            modal.addComponents(new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId("transfer_id")
                .setLabel("معرّف العضو الجديد (User ID)")
                .setStyle(TextInputStyle.Short).setMinLength(17).setMaxLength(20).setRequired(true)
            ));
            return interaction.showModal(modal);
          }

        } catch (err) {
          console.error("[TempVC Button]", err.message);
          return interaction.reply({ content: "❌ حدث خطأ — تأكد من صلاحيات البوت.", ephemeral: true });
        }
      }

      // ── Music Player Buttons ─────────────────────────────────────────
      if (id.startsWith("music_")) {
        const { buildNowPlayingEmbed, buildPlayerButtons, getElapsed } = require("../handlers/music");
        const queue = client.musicQueues.get(interaction.guildId);

        if (!queue) return interaction.reply({ content: "❌ لا يوجد مشغّل نشط.", ephemeral: true });
        if (!interaction.member.voice.channel || interaction.member.voice.channelId !== queue.voiceChannelId) {
          return interaction.reply({ content: "❌ يجب أن تكون في نفس القناة الصوتية.", ephemeral: true });
        }

        const { checkCooldown } = require("../utils/cooldown");
        const rem = checkCooldown(interaction.user.id, id);
        if (rem > 0) return interaction.reply({ content: `⏳ انتظر **${(rem / 1000).toFixed(1)}ث**.`, ephemeral: true });

        // music_add: MUST show modal BEFORE any defer/reply
        if (id === "music_add") {
          const modal = new ModalBuilder().setCustomId("modal_music_add").setTitle("إضافة مقطع للقائمة");
          modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("track_query").setLabel("اسم الأغنية أو الرابط")
              .setStyle(TextInputStyle.Short).setRequired(true)
          ));
          return interaction.showModal(modal);
        }

        await interaction.deferUpdate();

        if (id === "music_pause") {
          if (queue._paused) {
            queue.player.unpause(); queue._startTime = Date.now(); queue._paused = false;
          } else {
            queue._elapsedBefore = getElapsed(queue); queue.player.pause(); queue._paused = true;
          }
          if (queue.current) {
            await interaction.editReply({
              embeds:     [buildNowPlayingEmbed(queue, getElapsed(queue))],
              components: buildPlayerButtons(queue._paused, queue.loopMode),
            }).catch(() => {});
          }
          return;
        }

        if (id === "music_skip") {
          queue.player.stop();
          return;
        }

        if (id === "music_stop") {
          queue.tracks = []; queue.current = null; queue.loopMode = "none";
          queue.player?.stop(true); queue.connection?.destroy();
          client.musicQueues.delete(interaction.guildId);
          return interaction.editReply({
            embeds: [new EmbedBuilder().setDescription("⏹️ تم إيقاف الموسيقى وتفريغ القائمة.").setColor(0xed4245)],
            components: [],
          }).catch(() => {});
        }

        if (id === "music_loop") {
          const modes = ["none", "track", "queue"];
          queue.loopMode = modes[(modes.indexOf(queue.loopMode) + 1) % modes.length];
          if (queue.current) {
            await interaction.editReply({
              embeds:     [buildNowPlayingEmbed(queue, getElapsed(queue))],
              components: buildPlayerButtons(queue._paused, queue.loopMode),
            }).catch(() => {});
          }
          return;
        }
      }
    }

    // ── Modal Submissions ──────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const id     = interaction.customId;
      const member = interaction.member;

      // ── Temp Voice Modals ────────────────────────────────────────────
      if (id === "modal_vc_limit") {
        const { getChannelByOwner } = require("../handlers/tempVoice");
        const owned = getChannelByOwner(interaction.guildId, member.id);
        const vc    = owned ? interaction.guild.channels.cache.get(owned.vcId) : null;
        if (!vc) return interaction.reply({ content: "❌ ليس لديك قناة نشطة.", ephemeral: true });
        const val = parseInt(interaction.fields.getTextInputValue("limit_value"), 10);
        if (isNaN(val) || val < 0 || val > 99)
          return interaction.reply({ content: "❌ أدخل رقماً بين 0 و 99.", ephemeral: true });
        await vc.setUserLimit(val);
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setDescription(`👥 تم تحديد حد قناة **${vc.name}**: **${val === 0 ? "بلا حدود" : `${val} أعضاء`}**`)
            .setColor(0x5865f2)],
          ephemeral: true,
        });
      }

      if (id === "modal_vc_rename") {
        const { getChannelByOwner } = require("../handlers/tempVoice");
        const owned = getChannelByOwner(interaction.guildId, member.id);
        const vc    = owned ? interaction.guild.channels.cache.get(owned.vcId) : null;
        if (!vc) return interaction.reply({ content: "❌ ليس لديك قناة نشطة.", ephemeral: true });
        const name = interaction.fields.getTextInputValue("rename_value").trim();
        if (!name) return interaction.reply({ content: "❌ الاسم فارغ.", ephemeral: true });
        await vc.setName(name);
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setDescription(`✅ تم تغيير اسم قناتك إلى: **${name}**`)
            .setColor(0x57f287)],
          ephemeral: true,
        });
      }

      if (id === "modal_vc_kick") {
        const { getChannelByOwner } = require("../handlers/tempVoice");
        const owned = getChannelByOwner(interaction.guildId, member.id);
        const vc    = owned ? interaction.guild.channels.cache.get(owned.vcId) : null;
        if (!vc) return interaction.reply({ content: "❌ ليس لديك قناة نشطة.", ephemeral: true });
        const targetId = interaction.fields.getTextInputValue("kick_id").trim();
        const target   = vc.members.get(targetId);
        if (!target)             return interaction.reply({ content: "❌ العضو غير موجود في قناتك.", ephemeral: true });
        if (target.id === member.id) return interaction.reply({ content: "❌ لا تستطيع طرد نفسك.", ephemeral: true });
        await target.voice.disconnect();
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setDescription(`👢 تم طرد **${target.displayName}** من قناتك.`)
            .setColor(0xed4245)],
          ephemeral: true,
        });
      }

      if (id === "modal_vc_transfer") {
        const { getChannelByOwner, getChannel } = require("../handlers/tempVoice");
        const owned = getChannelByOwner(interaction.guildId, member.id);
        const vc    = owned ? interaction.guild.channels.cache.get(owned.vcId) : null;
        if (!vc) return interaction.reply({ content: "❌ ليس لديك قناة نشطة.", ephemeral: true });
        const targetId = interaction.fields.getTextInputValue("transfer_id").trim();
        const target   = vc.members.get(targetId);
        if (!target)         return interaction.reply({ content: "❌ العضو غير موجود في قناتك.", ephemeral: true });
        if (target.user.bot) return interaction.reply({ content: "❌ لا تستطيع نقل الملكية لبوت.", ephemeral: true });
        if (target.id === member.id) return interaction.reply({ content: "❌ أنت المالك بالفعل.", ephemeral: true });
        const chData = getChannel(owned.vcId);
        if (chData) chData.ownerId = target.id;
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setDescription(`👑 نُقلت ملكية **${vc.name}** إلى **${target.displayName}**`)
            .setColor(0xfee75c)],
          ephemeral: true,
        });
      }

      // ── Music Add Modal ──────────────────────────────────────────────
      if (id === "modal_music_add") {
        const { searchTrack } = require("../handlers/music");
        await interaction.deferReply({ ephemeral: true });
        const queue = client.musicQueues.get(interaction.guildId);
        if (!queue) return interaction.editReply({ content: "❌ لا يوجد مشغّل نشط." });
        const tracks = await searchTrack(interaction.fields.getTextInputValue("track_query"), interaction.user.tag);
        if (!tracks?.length) return interaction.editReply({ content: "❌ لم يُعثر على نتائج." });
        queue.tracks.push(...tracks);
        return interaction.editReply({
          content: `✅ تمت إضافة **${tracks.length === 1 ? tracks[0].title : `${tracks.length} مقاطع`}** للقائمة.`,
        });
      }
    }
  },
};
