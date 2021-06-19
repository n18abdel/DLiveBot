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
const { parseDatabase, updateDatabase, logLoginTime } = require("./helpers/db");
const {
  createChatWebSocket,
  createChestWebSocket,
  getDisplayname,
} = require("./helpers/request");
const {
  loadCommands,
  clearCommands,
  upsertCommands,
  getOptions,
} = require("./helpers/command");

client.commands = {};
Object.entries(
  loadCommands({ folder: "commands", container: client.commands })
).forEach(([command, path]) => {
  client.commands[command] = require(path);
});

// ================= BOT STATE VARIABLES ===================
/** {guildId: [websocket]}
 * Websockets of added streamers
 */
const websockets = {};

/** {guildId: {streamerUsername: boolean}}
 * Previous streaming state of added streamers
 */
let wasLive = {};

/** {guildId: channelId}
 * Channels where the bot should send the alerts
 */
let alertChannels = {};

/** {guildId: {streamerUsername: messageId}}
 * History of the latest sent alert messages
 * to be able to update them
 */
let alertHistory = {};

/** {guildId: {streamerUsername: stream}}
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

// ================= DISCORD BOT ===================
client.on("ready", async () => {
  // Initialize the bot
  console.log("[Discord]", `Logged in as ${client.user.tag}!`);

  // Log last login time
  logLoginTime();

  ({ wasLive, alertChannels, alertHistory, lastStreams, settings } =
    await parseDatabase());
  /**
   * Retrieve previously set up alerts
   * and recreate the associated websockets
   * */
  Object.keys(wasLive).forEach(async (guildId) => {
    if (client.guilds.cache.get(guildId)) {
      websockets[guildId] = [];
      Object.keys(wasLive[guildId]).forEach((username) => {
        const channelId = alertChannels[guildId];

        getDisplayname(username)
          .then((displayname) => {
            const ws = createChatWebSocket(
              username,
              displayname,
              guildId,
              channelId,
              getBotState()
            );
            const cs = createChestWebSocket(
              username,
              displayname,
              guildId,
              channelId,
              getBotState()
            );
            websockets[guildId].push(ws);
            websockets[guildId].push(cs);
          })
          .catch((error) => console.log(error));
      });
    } else {
      await clear(guildId);
    }
  });

  /* DEBUG to check bot permissions
  const guildIdToCheck = "<toFill>"
  const channelIdToCheck = "<toFill>"
  console.log(client.guilds.cache.get(guildIdToCheck).me.permissions.toArray())
  console.log(client.channels.cache.get(channelIdToCheck).permissionsFor(client.user).toArray())
  */
});

client.once("ready", () => {
  client.guilds.cache.forEach(async (guild) => {
    // clear old commands
    await clearCommands(guild, client.commands);
    // add/update the other commands
    await upsertCommands(guild, client.commands);
  });
});

client.on("guildCreate", (guild) => {
  upsertCommands(guild, client.commands);
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
      const {
        commandName,
        guild: { id: guildId },
        channel: { id: channelId },
      } = interaction;
      if (commandName in client.commands) {
        const args = getOptions(interaction);
        const botState = getBotState();

        client.commands[commandName].func({
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
