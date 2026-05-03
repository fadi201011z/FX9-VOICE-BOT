// ── Simple JSON Persistence Layer ─────────────────────────────────────
const fs   = require("fs");
const path = require("path");

const DATA_DIR  = path.join(__dirname, "../../data");
const GUILDS_FILE = path.join(DATA_DIR, "guilds.json");
const ACTIVE_FILE = path.join(DATA_DIR, "active_channels.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function _read(file) {
  try {
    if (!fs.existsSync(file)) return {};
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch { return {}; }
}

function _write(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8"); }
  catch (e) { console.error("[DB] Write error:", e.message); }
}

// ── Guild Setups ──────────────────────────────────────────────────────
function loadGuilds()            { return _read(GUILDS_FILE); }
function saveGuild(guildId, cfg) {
  const all = _read(GUILDS_FILE);
  all[guildId] = cfg;
  _write(GUILDS_FILE, all);
}
function deleteGuild(guildId) {
  const all = _read(GUILDS_FILE);
  delete all[guildId];
  _write(GUILDS_FILE, all);
}

// ── Active Temp Voice Channels ────────────────────────────────────────
function loadActiveChannels()              { return _read(ACTIVE_FILE); }
function saveActiveChannel(vcId, data)    {
  const all = _read(ACTIVE_FILE);
  all[vcId] = data;
  _write(ACTIVE_FILE, all);
}
function removeActiveChannel(vcId) {
  const all = _read(ACTIVE_FILE);
  delete all[vcId];
  _write(ACTIVE_FILE, all);
}

module.exports = {
  loadGuilds, saveGuild, deleteGuild,
  loadActiveChannels, saveActiveChannel, removeActiveChannel,
};
