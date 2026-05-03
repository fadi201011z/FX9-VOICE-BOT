// ── Music Handler ─────────────────────────────────────────────────────
// Architecture: youtube-sr (search) → yt-dlp (extract) → ffmpeg → Discord
// yt-dlp handles all YouTube changes automatically (updated daily)

const { spawn }     = require("child_process");
const ffmpegPath    = require("ffmpeg-static");
const { PassThrough } = require("stream");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
} = require("@discordjs/voice");

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

// ── Lazy-load youtube-sr ──────────────────────────────────────────────
let _YouTube = null;
function getYouTube() {
  if (!_YouTube) _YouTube = require("youtube-sr").default;
  return _YouTube;
}

// ── FFmpeg: convert audio URL → raw PCM s16le ─────────────────────────
// Uses PassThrough to avoid backpressure issues with @discordjs/voice
function createFfmpegStream(audioUrl) {
  const pass = new PassThrough();

  const proc = spawn(ffmpegPath, [
    "-reconnect",          "1",
    "-reconnect_streamed", "1",
    "-reconnect_delay_max","5",
    "-i",                  audioUrl,
    "-vn",                         // strip any video track
    "-analyzeduration",    "0",
    "-loglevel",           "8",    // only fatal errors
    "-f",                  "s16le",// raw PCM
    "-ar",                 "48000",// Discord sample rate
    "-ac",                 "2",    // stereo
    "pipe:1",
  ], { stdio: ["ignore", "pipe", "pipe"] });

  proc.stdout.pipe(pass);
  proc.stderr.on("data", d => {
    const msg = d.toString().trim();
    if (msg) console.error("[FFmpeg]", msg);
  });
  proc.on("error", err => {
    console.error("[FFmpeg spawn]", err.message);
    pass.destroy(err);
  });
  proc.on("close", code => {
    if (code !== 0) pass.destroy(new Error(`FFmpeg exited with code ${code}`));
    else pass.end();
  });

  return pass;
}

// ── Queue Factory ─────────────────────────────────────────────────────
function createQueue(guildId, voiceChannel, textChannelId) {
  return {
    guildId,
    voiceChannelId:  voiceChannel.id,
    textChannelId,
    tracks:          [],
    current:         null,
    volume:          80,
    loopMode:        "none",
    playerMessageId: null,
    isPlaying:       false,
    _paused:         false,
    _startTime:      null,
    _elapsedBefore:  0,
    _idleTimer:      null,
    _resource:       null,
    connection:      null,
    player:          null,
  };
}

// ── Utilities ─────────────────────────────────────────────────────────
function formatTime(sec) {
  if (!sec || sec === Infinity || isNaN(sec)) return "🔴 Live";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getElapsed(queue) {
  if (!queue._startTime) return 0;
  if (queue._paused) return queue._elapsedBefore;
  return queue._elapsedBefore + Math.floor((Date.now() - queue._startTime) / 1000);
}

function progressBar(cur, total, sz = 15) {
  if (!total || total === Infinity || isNaN(total)) return "▓".repeat(sz);
  const f = Math.round(Math.min(cur / total, 1) * sz);
  return "▓".repeat(f) + "░".repeat(sz - f);
}

// ── Now Playing Embed ─────────────────────────────────────────────────
function buildNowPlayingEmbed(queue, elapsed = 0) {
  const t = queue.current;
  if (!t) return null;
  const bar = progressBar(elapsed, t.durationSec);
  const rem = t.durationSec ? formatTime(Math.max(0, t.durationSec - elapsed)) : "∞";
  const loopLabel = { none: "➡️ بدون", track: "🔂 مقطع", queue: "🔁 قائمة" }[queue.loopMode];
  const embed = new EmbedBuilder()
    .setColor(0x1db954)
    .setAuthor({ name: "🎵 يُشغَّل الآن — FX9-VOICE" })
    .setTitle(t.title.length > 60 ? t.title.slice(0, 57) + "..." : t.title)
    .setURL(t.url)
    .addFields(
      { name: "👤 الفنان",    value: t.author || "—",             inline: true },
      { name: "⏱️ المدة",    value: formatTime(t.durationSec),   inline: true },
      { name: "⏳ المتبقي",  value: rem,                          inline: true },
      { name: "🔊 الصوت",   value: `${queue.volume}%`,           inline: true },
      { name: "🔁 التكرار", value: loopLabel,                    inline: true },
      { name: "📋 انتظار",  value: `${queue.tracks.length} 🎵`,  inline: true },
    )
    .setDescription(`\`${formatTime(elapsed)}\` ${bar} \`${formatTime(t.durationSec)}\``)
    .setFooter({ text: `طُلب من: ${t.requestedBy}` })
    .setTimestamp();
  // Only set thumbnail if URL is valid
  if (t.thumbnail && t.thumbnail.startsWith("http")) embed.setThumbnail(t.thumbnail);
  return embed;
}

// ── Player Buttons ────────────────────────────────────────────────────
function buildPlayerButtons(paused = false, loopMode = "none") {
  const loopStyle = loopMode === "none" ? ButtonStyle.Secondary : ButtonStyle.Success;
  const loopLabel = { none: "🔁 تكرار", track: "🔂 مقطع", queue: "🔁 قائمة" }[loopMode];
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("music_pause").setLabel(paused ? "▶️ استكمال" : "⏸️ توقف").setStyle(paused ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("music_skip") .setLabel("⏭️ تخطي")  .setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("music_stop") .setLabel("⏹️ إيقاف") .setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("music_loop") .setLabel(loopLabel)  .setStyle(loopStyle),
    new ButtonBuilder().setCustomId("music_add")  .setLabel("➕ أضف")   .setStyle(ButtonStyle.Secondary),
  )];
}

// ── Connect ───────────────────────────────────────────────────────────
function connectToChannel(voiceChannel, adapterCreator) {
  return joinVoiceChannel({
    channelId: voiceChannel.id, guildId: voiceChannel.guildId,
    adapterCreator, selfDeaf: true,
  });
}

// ── Idle Timer ────────────────────────────────────────────────────────
function resetIdleTimer(client, guildId) {
  const queue = client.musicQueues.get(guildId);
  if (!queue) return;
  if (queue._idleTimer) clearTimeout(queue._idleTimer);
  queue._idleTimer = setTimeout(async () => {
    const q = client.musicQueues.get(guildId);
    if (!q || q.isPlaying) return;
    q.connection?.destroy();
    client.musicQueues.delete(guildId);
    try {
      const ch = client.guilds.cache.get(guildId)?.channels.cache.get(q.textChannelId);
      const msg = await ch?.send({
        embeds: [new EmbedBuilder()
          .setDescription("🔌 غادر البوت القناة بسبب عدم النشاط.")
          .setColor(0xfee75c)
          .setFooter({ text: "تُحذف هذه الرسالة خلال 20 ثانية" })],
      });
      if (msg?.deletable) setTimeout(() => msg.delete().catch(() => {}), 20_000);
    } catch (_) {}
  }, 3 * 60 * 1000);
}

// ── Search ────────────────────────────────────────────────────────────
async function searchTrack(query, requestedBy) {
  const { getVideoInfo } = require("../utils/ytdlp");
  const YouTube = getYouTube();
  try {
    const ytUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(query);
    if (ytUrl) {
      if (query.includes("list=") && !query.includes("watch?v=")) {
        // Playlist
        const pl = await YouTube.getPlaylist(query, { fetchAll: true });
        if (!pl) return null;
        return pl.videos.slice(0, 100).map(v => ({
          title: v.title || "Unknown",
          url: `https://www.youtube.com/watch?v=${v.id}`,
          author: v.channel?.name || "Unknown",
          durationSec: Math.floor((v.duration || 0) / 1000),
          thumbnail: v.thumbnail?.url || null,
          requestedBy,
        }));
      }
      // Single video
      const info = await getVideoInfo(query);
      return [{ ...info, requestedBy }];
    }
    // Text search
    const results = await YouTube.search(query, { limit: 5, type: "video" });
    if (!results?.length) return null;
    const v = results[0];
    return [{
      title: v.title || "Unknown",
      url: `https://www.youtube.com/watch?v=${v.id}`,
      author: v.channel?.name || "Unknown",
      durationSec: Math.floor((v.duration || 0) / 1000),
      thumbnail: v.thumbnail?.url || null,
      requestedBy,
    }];
  } catch (err) {
    console.error("[Music] searchTrack:", err.message);
    return null;
  }
}

// ── Search Multiple ───────────────────────────────────────────────────
async function searchMultiple(query, limit = 5) {
  const YouTube = getYouTube();
  try {
    return (await YouTube.search(query, { limit, type: "video" }) || []).map(v => ({
      title: v.title || "Unknown",
      url: `https://www.youtube.com/watch?v=${v.id}`,
      author: v.channel?.name || "Unknown",
      durationSec: Math.floor((v.duration || 0) / 1000),
      thumbnail: v.thumbnail?.url || null,
    }));
  } catch { return []; }
}

// ── Core: Play Next ───────────────────────────────────────────────────
async function playNext(client, guildId) {
  const queue = client.musicQueues.get(guildId);
  if (!queue) return;

  if (queue.loopMode === "track" && queue.current)  queue.tracks.unshift({ ...queue.current });
  else if (queue.loopMode === "queue" && queue.current) queue.tracks.push({ ...queue.current });

  if (!queue.tracks.length) {
    queue.isPlaying = false; queue.current = null; queue._elapsedBefore = 0;
    await sendQueueEndEmbed(client, queue);
    resetIdleTimer(client, guildId);
    return;
  }

  const track = queue.tracks.shift();
  queue.current = track; queue.isPlaying = true;
  queue._paused = false; queue._startTime = Date.now(); queue._elapsedBefore = 0;

  try {
    const { getAudioUrl } = require("../utils/ytdlp");
    console.log(`[Music] 🔍 "${track.title}"`);

    const audioUrl = await getAudioUrl(track.url);
    console.log(`[Music] ▶  Streaming via ffmpeg`);

    const stream   = createFfmpegStream(audioUrl);
    const resource = createAudioResource(stream, {
      inputType:    StreamType.Raw,   // raw PCM s16le
      inlineVolume: true,
    });
    resource.volume?.setVolumeLogarithmic(queue.volume / 100);

    queue.player.play(resource);
    queue._resource = resource;
    await sendNowPlayingEmbed(client, queue);
  } catch (err) {
    console.error(`[Music] ❌ "${track.title}": ${err.message}`);
    await sendErrorEmbed(client, queue, track, err.message);
    setTimeout(() => playNext(client, guildId), 1500);
  }
}

// ── Embeds ────────────────────────────────────────────────────────────
async function sendNowPlayingEmbed(client, queue) {
  try {
    const ch = client.guilds.cache.get(queue.guildId)?.channels.cache.get(queue.textChannelId);
    if (!ch) return;
    if (queue.playerMessageId) {
      const old = await ch.messages.fetch(queue.playerMessageId).catch(() => null);
      if (old) await old.delete().catch(() => {});
      queue.playerMessageId = null;
    }
    const msg = await ch.send({ embeds: [buildNowPlayingEmbed(queue, 0)], components: buildPlayerButtons(false, queue.loopMode) });
    queue.playerMessageId = msg.id;
  } catch (err) { console.error("[Music] sendNowPlaying:", err.message); }
}

async function updateNowPlayingEmbed(client, guildId) {
  const queue = client.musicQueues.get(guildId);
  if (!queue?.current || !queue.playerMessageId || !queue.isPlaying) return;
  try {
    const ch  = client.guilds.cache.get(guildId)?.channels.cache.get(queue.textChannelId);
    const msg = await ch?.messages.fetch(queue.playerMessageId).catch(() => null);
    if (!msg) return;
    await msg.edit({ embeds: [buildNowPlayingEmbed(queue, getElapsed(queue))], components: buildPlayerButtons(queue._paused, queue.loopMode) }).catch(() => {});
  } catch (_) {}
}

async function sendQueueEndEmbed(client, queue) {
  try {
    const ch = client.guilds.cache.get(queue.guildId)?.channels.cache.get(queue.textChannelId);
    if (!ch || !queue.playerMessageId) return;
    const msg = await ch.messages.fetch(queue.playerMessageId).catch(() => null);
    if (msg) {
      await msg.edit({
        embeds: [new EmbedBuilder()
          .setDescription("✅ انتهت قائمة التشغيل.")
          .setColor(0xfee75c)
          .setFooter({ text: "تُحذف هذه الرسالة خلال 30 ثانية" })],
        components: [],
      }).catch(() => {});
      // Auto-delete the ended-queue message after 30s
      setTimeout(() => msg.delete().catch(() => {}), 30_000);
    }
    queue.playerMessageId = null;
  } catch (_) {}
}

async function sendErrorEmbed(client, queue, track, reason) {
  try {
    const ch = client.guilds.cache.get(queue.guildId)?.channels.cache.get(queue.textChannelId);
    const msg = await ch?.send({
      embeds: [new EmbedBuilder()
        .setDescription(`⚠️ **${track.title}**\n\`${reason.slice(0, 200)}\`\nجاري التخطي...`)
        .setColor(0xed4245)
        .setFooter({ text: "تُحذف هذه الرسالة خلال 15 ثانية" })],
    }).catch(() => null);
    if (msg?.deletable) setTimeout(() => msg.delete().catch(() => {}), 15_000);
  } catch (_) {}
}

// ── Init Player ───────────────────────────────────────────────────────
function initPlayer(client, guildId) {
  const queue = client.musicQueues.get(guildId);
  if (!queue) return;
  const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
  player.on(AudioPlayerStatus.Idle, () => { if (!queue._paused) { queue._elapsedBefore = 0; playNext(client, guildId); } });
  player.on("error", err => { console.error(`[Player] ${err.message}`); setTimeout(() => playNext(client, guildId), 1000); });
  queue.connection.on(VoiceConnectionStatus.Destroyed, () => { player.stop(true); client.musicQueues.delete(guildId); });
  queue.connection.on("error", err => console.error("[Voice]", err.message));
  queue.player = player;
  queue.connection.subscribe(player);
}

module.exports = {
  createQueue, connectToChannel, initPlayer, playNext,
  searchTrack, searchMultiple,
  buildNowPlayingEmbed, buildPlayerButtons, updateNowPlayingEmbed,
  getElapsed, formatTime, resetIdleTimer,
};
