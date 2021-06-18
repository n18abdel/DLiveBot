const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => res.send("dlivebot is alive!"));

app.listen(port);

// ================= START BOT CODE ===================
const Discord = require("discord.js");
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
});

let settings = require("./settings");
const { parseDatabase, updateDatabase, loginTime } = require("./helpers/db");
const {
  createChatWebSocket,
  createChestWebSocket,
} = require("./helpers/request");

const fs = require("fs");
const commandsList = fs.readdirSync("./commands"); // return an array of all the files and folders inside the commands folder
client.commands = {}; // initiate value for the command list of client
for (const item of commandsList) {
  if (item.match(/\.js$/)) {
    // only take js files
    const commandName = item.slice(0, -3);
    client.commands[commandName] = require(`./commands/${item}`); // and put the require inside the client.commands object
  }
}

// ================= BOT STATE VARIABLES ===================
/** {guildId: [websocket]}
 * Websockets of added streamers
 */
let websockets = {};

/** {guildId: {streamerDisplayname: boolean}}
 * Previous streaming state of added streamers
 */
let wasLive = {};

/** {guildId: channelId}
 * Channels where the bot should send the alerts
 */
let alertChannels = {};

/** {guildId: {streamerDisplayname: messageId}}
 * History of the latest sent alert messages
 * to be able to update them
 */
let alertHistory = {};

/** {guildId: {streamerDisplayname: stream}}
 * Latest streams with sent alert
 */
let lastStreams = {};

const getBotState = () => ({
  client,
  settings,
  wasLive,
  alertHistory,
  lastStreams,
  alertChannels,
  websockets,
});

// ================= DISCORD BOT ===================
client.on("ready", async () => {
  // Initialize the bot
  console.log("[Discord]", `Logged in as ${client.user.tag}!`);

  // Log last login time
  loginTime();

  ({ wasLive, alertChannels, alertHistory, lastStreams, settings } =
    await parseDatabase(settings));
  /**
   * Retrieve previously set up alerts
   * and recreate the associated websockets
   * */
  for (let guildId in wasLive) {
    if (client.guilds.cache.get(guildId)) {
      websockets[guildId] = [];
      for (let displayname in wasLive[guildId]) {
        let channelId = alertChannels[guildId];
        let ws = createChatWebSocket(
          displayname,
          guildId,
          channelId,
          getBotState()
        );
        let cs = createChestWebSocket(
          displayname,
          guildId,
          channelId,
          getBotState()
        );
        websockets[guildId].push(ws);
        websockets[guildId].push(cs);
      }
    } else {
      await clear(guildId);
    }
  }
  /* DEBUG to check bot permissions
  const guildIdToCheck = "<toFill>"
  const channelIdToCheck = "<toFill>"
  console.log(client.guilds.cache.get(guildIdToCheck).me.permissions.toArray())
  console.log(client.channels.cache.get(channelIdToCheck).permissionsFor(client.user).toArray())
  */
});

const getOptions = (interaction) => {
  const options = interaction.options;
  const args = {};

  if (options) {
    for (const option of options.values()) {
      const { name, value } = option;
      args[name] = value;
    }
  }
  return args;
};

const clear = async (guildId) => {
  if (websockets[guildId]) {
    websockets[guildId].forEach((ws) => {
      clearTimeout(ws.pingTimeout);
      ws.terminate();
    });
  }

  delete wasLive[guildId];
  delete alertChannels[guildId];
  delete alertHistory[guildId];
  delete lastStreams[guildId];
  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );
};

const upsertCommands = async (guild) => {
  await guild.commands.set(
    Object.values(client.commands).map((command) => command.commandData)
  );
  // allow admin roles and guild owner
  const roles = guild.roles.cache.filter((role) =>
    role.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)
  );
  const permissions = roles.map((role) => ({
    id: role.id,
    type: "ROLE",
    permission: true,
  }));
  permissions.push({
    id: guild.ownerID,
    type: "USER",
    permission: true,
  });
  await guild.commands.fetch().then(async (existingCommands) => {
    const setPermissionsObj = existingCommands.map((command) => ({
      id: command.id,
      permissions,
    }));
    await guild.commands.setPermissions(setPermissionsObj);
  });
};

client.once("ready", () => {
  client.guilds.cache.forEach(async (guild) => {
    // clear old commands
    await guild.commands.fetch().then((existingCommands) =>
      existingCommands.forEach(async (existingCommand) => {
        const { name } = existingCommand;
        if (!(name in client.commands)) {
          await existingCommand.delete();
        }
      })
    );
    // add/update the other commands
    await upsertCommands(guild);
  });
});

client.on("guildCreate", (guild) => {
  upsertCommands(guild);
});

client.on("guildDelete", async (guild) => {
  // do nothing if the server is only in outage
  if (guild.available) {
    const guildId = guild.id;
    await clear(guildId);
  }
});

client.on("interaction", async (interaction) => {
  try {
    const isAdmin = interaction.member.permissions.has(
      Discord.Permissions.FLAGS.ADMINISTRATOR
    );
    const isAlertChannel = interaction.channel.name.includes("alerte");
    if (interaction.isCommand() && isAdmin && isAlertChannel) {
      const guildId = interaction.guild.id;
      const channelId = interaction.channel.id;
      const args = getOptions(interaction);
      const botState = getBotState();

      if (interaction.commandName in client.commands) {
        client.commands[interaction.commandName].func({
          interaction,
          guildId,
          channelId,
          args,
          botState,
        });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

// You really don't want your token here since your repl's code
// is publically available. We'll take advantage of a Repl.it
// feature to hide the token we got earlier.
client.login(process.env.DISCORD_TOKEN);
