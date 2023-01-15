const express = require("express");
const { config } = require("dotenv");

config();

const app = express();
const port = 3000;

app.get("/", (req, res) => res.send("dlivebot is alive!"));

app.listen(port);

// ================= START BOT CODE ===================
const Discord = require("discord.js");

const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
});

const { parseDatabase, updateDatabase, logLoginTime } = require("./helpers/db");
const { addWebSockets, closeWebSockets } = require("./helpers/websocket");
const { getDisplayname } = require("./helpers/request");
const {
  loadCommands,
  clearCommands,
  upsertCommands,
} = require("./helpers/command");

client.commands = {};
Object.entries(
  loadCommands({ folder: "commands", container: client.commands })
).forEach(([command, path]) => {
  client.commands[command] = require(path);
});

// ================= BOT STATE VARIABLES ===================
/**
 * {guildId: [websocket]}
 * Websockets of added streamers
 */
const websockets = {};

/**
 * {guildId: {streamerUsername: boolean}}
 * Previous streaming state of added streamers
 */
let wasLive = {};

/**
 * {guildId: channelId}
 * Channels where the bot should send the alerts
 */
let alertChannels = {};

/**
 * {guildId: {streamerUsername: messageId}}
 * History of the latest sent alert messages
 * to be able to update them
 */
let alertHistory = {};

/**
 * {guildId: {streamerUsername: stream}}
 * Latest streams with sent alert
 */
let lastStreams = {};

/**
 * {guildId: settings}
 * Settings per guild
 */
let settings = {};

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
  closeWebSockets(websockets, guildId);
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
  console.log("[Discord]", `Logged in as ${client.user.tag}!`);

  logLoginTime();

  ({ wasLive, alertChannels, alertHistory, lastStreams, settings } =
    await parseDatabase());
  /**
   * Retrieve previously set up alerts
   * and recreate the associated websockets
   */
  Object.keys(wasLive).forEach(async (guildId) => {
    if (client.guilds.cache.get(guildId)) {
      websockets[guildId] = [];
      Object.keys(wasLive[guildId]).forEach((username) => {
        const channelId = alertChannels[guildId];

        getDisplayname(username)
          .then((displayname) => {
            addWebSockets(
              username,
              displayname,
              guildId,
              channelId,
              getBotState()
            );
          })
          .catch((error) => console.log(error));
      });
    } else {
      await clear(guildId);
    }
  });
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
  // kicked from server or server outage
  if (guild.available) {
    // not an outage so kicked from server
    const guildId = guild.id;
    await clear(guildId);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    const isAlertChannel = interaction.channel.name.includes("alert");
    if (interaction.isCommand() && isAlertChannel) {
      if (interaction.commandName in client.commands) {
        const botState = getBotState();

        client.commands[interaction.commandName].func({
          interaction,
          botState,
        });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

client.login(process.env.DISCORD_TOKEN);
