require("dotenv").config();
const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
const fs = require("fs");
const path = require("path");
const express = require('express');

// ── Express Server (Keep-Alive for Render) ──────────────────────────
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('FX9-VOICE is Online and Ready!');
});

app.listen(port, () => {
  console.log(`[WEB] Keep-alive server running on port ${port}`);
});

// ── Set ffmpeg path ───────────────────────────────────────────────────
try {
  process.env.FFMPEG_PATH = require("ffmpeg-static");
} catch (e) {
  console.error("FFMPEG-STATIC not found, make sure it is in package.json");
}

// ── Pre-download yt-dlp in background ────────────────────────────────
setImmediate(() => {
  try {
    require("./utils/ytdlp").ensureYtDlp().catch(err =>
      console.error("[yt-dlp] Pre-download failed:", err.message)
    );
  } catch (e) {
    console.log("[yt-dlp] Utils not found, skipping pre-download.");
  }
});

// ── Discord Client ────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();
client.musicQueues = new Map();

// ── Load Commands ─────────────────────────────────────────────────────
const cmdPath = path.join(__dirname, "commands");
if (fs.existsSync(cmdPath)) {
  for (const f of fs.readdirSync(cmdPath).filter(f => f.endsWith(".js"))) {
    const cmd = require(path.join(cmdPath, f));
    if (cmd.data && cmd.execute) {
      client.commands.set(cmd.data.name, cmd);
      console.log(`[CMD] Loaded /${cmd.data.name}`);
    }
  }
}

// ── Load Events ───────────────────────────────────────────────────────
const evtPath = path.join(__dirname, "events");
if (fs.existsSync(evtPath)) {
  for (const f of fs.readdirSync(evtPath).filter(f => f.endsWith(".js"))) {
    const evt = require(path.join(evtPath, f));
    evt.once
      ? client.once(evt.name, (...a) => evt.execute(...a, client))
      : client.on(evt.name, (...a) => evt.execute(...a, client));
  }
}

// ── Login ─────────────────────────────────────────────────────────────
client.login(process.env.TOKEN).catch(e => {
  console.error("❌ فشل تسجيل الدخول:", e.message);
  process.exit(1);
});