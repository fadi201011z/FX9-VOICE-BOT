require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs   = require("fs");
const path = require("path");

const commands = [];
const cmdPath  = path.join(__dirname, "commands");
for (const f of fs.readdirSync(cmdPath).filter(f => f.endsWith(".js"))) {
  const cmd = require(path.join(cmdPath, f));
  if (cmd.data) commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`[Deploy] تسجيل ${commands.length} أوامر...`);
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log(`[Deploy] ✅ تم تسجيل ${data.length} أوامر:\n` + data.map(c => `   /${c.name}`).join("\n"));
  } catch (err) {
    console.error("[Deploy] ❌ خطأ:", err.message);
  }
})();
