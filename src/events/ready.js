// ── Ready Event ───────────────────────────────────────────────────────
const { ActivityType } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    const { updateNowPlayingEmbed }                                                                    = require("../handlers/music");
    const { loadFromDisk, getAllSetups, buildStatusPanel, updatePanelMessageId, getActiveCount, cleanStaleChannels } = require("../handlers/tempVoice");

    // Load persisted guild setups + clean stale channel entries
    loadFromDisk();
    await cleanStaleChannels(client);

    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║     FX9-VOICE Bot v3.0 — Ready!        ║`);
    console.log(`╠════════════════════════════════════════╣`);
    console.log(`║  Tag:    ${client.user.tag.padEnd(30)}║`);
    console.log(`║  Guilds: ${String(client.guilds.cache.size).padEnd(30)}║`);
    console.log(`╚════════════════════════════════════════╝\n`);

    // ── Rotating presence ─────────────────────────────────────────────
    const statuses = [
      { name: "🔊 قنوات مؤقتة | FX9-VOICE", type: ActivityType.Watching  },
      { name: "🎙️ /setup للبدء",            type: ActivityType.Playing   },
      { name: "🎛️ لوحة تحكم ذكية",          type: ActivityType.Listening },
    ];
    let i = 0;
    const rotate = () => {
      client.user.setPresence({ activities: [statuses[i++ % statuses.length]], status: "online" });
    };
    rotate();
    setInterval(rotate, 30_000);

    // ── Restore / update permanent panels for all saved guilds ────────
    for (const [guildId, setup] of getAllSetups()) {
      try {
        const guild   = client.guilds.cache.get(guildId);
        if (!guild) continue;
        const textCh  = guild.channels.cache.get(setup.textChannelId);
        if (!textCh) continue;

        const count = getActiveCount(guildId);
        const panel = buildStatusPanel(setup, count);

        // Try to edit existing panel message
        if (setup.panelMessageId) {
          const existing = await textCh.messages.fetch(setup.panelMessageId).catch(() => null);
          if (existing) {
            await existing.edit(panel).catch(() => {});
            console.log(`[TempVC] ✅ Panel restored for guild ${guildId}`);
            continue;
          }
        }

        // Panel not found — send a new one
        const msg = await textCh.send(panel);
        updatePanelMessageId(guildId, msg.id);
        console.log(`[TempVC] ✅ New panel sent for guild ${guildId}`);
      } catch (err) {
        console.error(`[TempVC] ❌ Panel restore for ${guildId}:`, err.message);
      }
    }

    // ── Auto-update Now Playing embed every 12s ───────────────────────
    setInterval(async () => {
      for (const [guildId] of client.musicQueues) {
        await updateNowPlayingEmbed(client, guildId);
      }
    }, 12_000);
  },
};
