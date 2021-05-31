const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => res.send("dlivebot is alive!"));

app.listen(port);

const https = require("https");

// ================= START BOT CODE ===================
const Discord = require("discord.js");
const client = new Discord.Client();

const fs = require("fs");
const WebSocket = require("ws");

const moment = require("moment-timezone");
const timezone = "Europe/Paris";

// delay in seconds without heartbeat
// after which the websockets are restarted
const timeoutDelay = 2 * 60;

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

/** {guildId: {streamerDisplayname: vodlink}}
 * Latest VOD links
 */
let vodPermlinks = {};

// ================= ALERT MESSAGE HELPERS ===================

/**
 * Message sent on discord when an added streamer goes live
 *
 * @param {string} displayname
 * @return {string}
 */
const getAlertMessage = (displayname) => {
  return `Hey @everyone ${displayname} est en direct`;
};

/**
 * Message options for the alert sent on discord
 *
 * @param {string} displayname
 * @param {object} stream
 * @param {boolean} online - whether the stream is on
 * @param {number} chestValue
 * @param {string} permlink
 * @param {string} guildId
 * @param {string} offlineImage
 * @return {object}
 */
const getAlertMessageOptions = (
  displayname,
  stream,
  online,
  chestValue,
  permlink,
  guildId,
  offlineImage
) => {
  const msgEmbed = new Discord.MessageEmbed()
    .setColor("#ffd300")
    .setFooter("Provided by Son Son Association Enterprise®");

  if (online) {
    const now = moment();
    const startedAt = moment.unix(Number(stream.createdAt) / 1000);
    const duration = (now - startedAt) / 1000 / 60;
    const hours = Math.floor(duration / 60);
    const minutes = Math.round(duration - hours * 60);

    let streamReward = Number(stream.totalReward) / 100000;
    streamReward =
      streamReward > 1000
        ? `${Math.round((streamReward / 1000) * 100) / 100}K`
        : Math.round(streamReward * 100) / 100;

    let viewers = Number(stream.watchingCount);
    viewers =
      viewers > 1000 ? `${Math.round((viewers / 1000) * 10) / 10}K` : viewers;

    msgEmbed
      .setTitle(`:red_circle: **${displayname} est en direct sur DLive !**`)
      .addField("Titre", stream.title)
      .addField("Catégorie", stream.category.title)
      .setThumbnail(stream.category.imgUrl)
      .addField("Spectateurs", viewers, true)
      .setImage(stream.thumbnailUrl)
      .addField(
        "En live depuis",
        hours > 0
          ? `${hours}h${minutes > 0 ? String(minutes).padStart(2, "0") : ""}`
          : `${minutes}min`,
        true
      )
      .addField("Citrons reçus", `${streamReward} :lemon:`, true)
      .setURL(`https://dlive.tv/${displayname}?ref=son-son`);
    if (chestValue) {
      msgEmbed.addField("Coffrio", `${chestValue} :lemon:`, true);
    }
  } else {
    //retrieve custom emojis
    const yeshaha = client.guilds.cache
      .get(guildId)
      .emojis.cache.find((emoji) => emoji.name == "yeshaha");
    const sourire = client.guilds.cache
      .get(guildId)
      .emojis.cache.find((emoji) => emoji.name == "sourire");
    const ohhhhh = client.guilds.cache
      .get(guildId)
      .emojis.cache.find((emoji) => emoji.name == "ohhhhh");

    msgEmbed
      .setTitle(`:white_circle: **${displayname} était en direct sur DLive**`)
      .setDescription(
        `Le stream est fini ${yeshaha}\nÀ la prochaine kaiser ${sourire}\n\nClique sur le lien pour voir la rediff ${ohhhhh}`
      )
      .setImage(offlineImage)
      .setURL(`https://dlive.tv/p/${permlink}?ref=son-son`);
  }

  return { embed: msgEmbed };
};

/**
 * Send alert message to the given channel
 *
 * @param {string} displayname
 * @param {string} stream
 * @param {string} guildId
 * @param {string} channelId
 * @param {string} channelName
 * @param {string} guildName
 */
const sendAlertMessage = (
  displayname,
  stream,
  guildId,
  channelId,
  channelName,
  guildName
) => {
  client.channels.cache
    .get(channelId)
    .send(
      getAlertMessage(displayname),
      getAlertMessageOptions(displayname, stream, (online = true))
    )
    .then((message) => {
      console.log(
        "[Discord]",
        `Sent announce msg to #${channelName} on ${guildName} for ${displayname}`
      );

      wasLive[guildId][displayname] = true;
      alertHistory[guildId][displayname] = message.id;
      vodPermlinks[guildId][displayname] = stream.permlink;
      updateDatabase(wasLive, alertChannels, alertHistory, vodPermlinks);
    })
    .catch((error) => console.log(error));
};

/**
 * Edit existing alert message with updates
 *
 * @param {string} displayname
 * @param {string} stream
 * @param {string} channelId
 * @param {string} channelName
 * @param {string} guildId
 * @param {string} guildName
 * @param {string} existingMsgId
 * @param {boolean} online - whether the stream is on
 * @param {number} chestValue
 * @param {string} permlink
 * @param {string} offlineImage
 */
const editAlertMessage = (
  displayname,
  stream,
  channelId,
  channelName,
  guildId,
  guildName,
  existingMsgId,
  online,
  chestValue,
  permlink,
  offlineImage
) => {
  client.channels.cache
    .get(channelId)
    .messages.fetch(existingMsgId)
    .then((existingMsg) => {
      existingMsg.edit(
        getAlertMessage(displayname),
        getAlertMessageOptions(
          displayname,
          stream,
          online,
          chestValue,
          permlink,
          guildId,
          offlineImage
        )
      );
    })
    .then((message) => {
      console.log(
        "[Discord]",
        `Edited announce msg to #${channelName} on ${guildName} for ${displayname}`
      );
      if (permlink) {
        // when the streamer goes offline
        wasLive[guildId][displayname] = false;
        delete alertHistory[guildId][displayname];
        delete vodPermlinks[guildId][displayname];
        updateDatabase(wasLive, alertChannels, alertHistory, vodPermlinks);
      }
    })
    .catch((error) => console.log(error));
};

// ================= BOT STATE DB HELPERS ===================

/**
 * Retrieve the previous state of the bot from stored files
 *
 */
const parseDatabase = () => {
  try {
    wasLive = JSON.parse(fs.readFileSync("wasLive.txt").toString());
    alertChannels = JSON.parse(fs.readFileSync("alertChannels.txt").toString());
    alertHistory = JSON.parse(fs.readFileSync("alertHistory.txt").toString());
    vodPermlinks = JSON.parse(fs.readFileSync("vodPermlinks.txt").toString());
  } catch (err) {
    if (err.code === "ENOENT") {
      // initialize the files if they do not exist
      updateDatabase({}, {}, {}, {});
    }
  }
};

/**
 * Update the stored files with the current state of the bot
 *
 * @param {object} wasLive
 * @param {object} channels
 * @param {object} alertHistory
 * @param {object} vodPermlinks
 */
const updateDatabase = (wasLive, channels, alertHistory, vodPermlinks) => {
  fs.writeFile("wasLive.txt", JSON.stringify(wasLive), (error) => {
    if (error) throw err;
  });
  fs.writeFile("alertChannels.txt", JSON.stringify(channels), (error) => {
    if (error) throw err;
  });
  fs.writeFile("alertHistory.txt", JSON.stringify(alertHistory), (error) => {
    if (error) throw err;
  });
  fs.writeFile("vodPermlinks.txt", JSON.stringify(vodPermlinks), (error) => {
    if (error) throw err;
  });
};

// ================= REQUEST HELPERS ===================

// options for http requests on DLive GraphQL API
const requestOptions = {
  hostname: "graphigo.prd.dlive.tv",
  port: 443,
  path: "/",
  method: "POST",
  headers: {
    accept: "*/*",
    "content-type": "application/json",
    Origin: "https://dlive.tv",
  },
};

/**
 * Do an http request with the inputed data
 *
 * @param {object} data
 */
const request = (data) =>
  new Promise((resolve, reject) => {
    const postData = typeof data === "object" ? JSON.stringify(data) : data;
    const req = https.request(requestOptions, (res) => {
      res.setEncoding("utf-8");
      res.on("data", (responseText) => {
        const response = JSON.parse(responseText).data;
        resolve(response);
      });
      res.on("error", (error) => reject(error));
    });
    req.write(postData);
    req.end();
  }).catch((error) => console.log(error));

/**
 * Retrieve the DLive username (different than displayname)
 *
 * @param {string} displayname
 */
const getUsername = (displayname) =>
  request({
    operationName: "LivestreamPage",
    query: `query LivestreamPage($displayname: String!) {
      userByDisplayName(displayname: $displayname) {
        username
        __typename
      }
    }`,
    variables: {
      displayname,
    },
  });

/**
 * Retrieve current stream info
 *
 * @param {string} displayname
 */
const getStreamInfo = (displayname) =>
  request({
    operationName: "LivestreamPage",
    query: `query LivestreamPage($displayname: String!) {
      userByDisplayName(displayname: $displayname) {
        livestream {
          title
          thumbnailUrl
          watchingCount
          createdAt
          category {
            title
            imgUrl
            __typename
          }
          totalReward
          permlink
          __typename
        }
        offlineImage
        __typename
      }
    }`,
    variables: {
      displayname,
    },
  });

/**
 * Create message to start websocket connection
 *
 * @param {string} username - username of the streamer (different than displayname)
 * @param {boolean} chest - whether to subscribe to chest or chat
 * @return {object}
 */
const createJoinMsg = (username, chest) => {
  if (chest) {
    return {
      id: "1",
      type: "start",
      payload: {
        query: `subscription{treasureChestMessageReceived(streamer:"${username}"){__typename}}`,
      },
    };
  } else {
    return {
      id: "1",
      type: "start",
      payload: {
        query: `subscription{streamMessageReceived(streamer:"${username}"){__typename}}`,
      },
    };
  }
};

/**
 * Create a websocket to listen to the chest of the given streamer
 *
 * @param {string} displayname
 * @param {string} guildId
 * @param {string} channelId
 * @return {WebSocket}
 */
const createChestWebSocket = (displayname, guildId, channelId) => {
  const guildName = client.guilds.cache.get(guildId).name;
  const channelName = client.channels.cache.get(channelId).name;
  let cs = new WebSocket("wss://graphigostream.prd.dlive.tv/", "graphql-ws");

  /**
   * Initialize the chest websocket
   *
   */
  cs.onopen = () => {
    cs.send('{"type":"connection_init","payload":{}}');

    getUsername(displayname).then((response) => {
      let username = response.userByDisplayName.username;
      let joinmsg = createJoinMsg(username, (chest = true));
      cs.send(JSON.stringify(joinmsg));
    });
  };

  /**
   * Process messages from the chest websocket
   *
   * @param {*} msg
   */
  cs.onmessage = (msg) => {
    msg = JSON.parse(msg.data);

    if (msg.type == "connection_ack") {
      console.log(
        "[WebSocket]",
        `${guildName} - Connected to chest websocket of ${displayname}`
      );
    } else if (msg.type == "ka") {
      // The server sends a "ka" message every 25 seconds
      // https://docs.dlive.tv/api/api/subscription-web-socket
      clearTimeout(cs.pingTimeout);

      // Create a new connection if we don't receive
      // the "ka" message 2mins after the last one

      cs.pingTimeout = setTimeout(() => {
        cs.close();
        let newCs = createChestWebSocket(displayname, guildId, channelId);
        websockets[guildId].push(newCs);
        console.log(
          "[WebSocket]",
          `${guildName} - Restarting chest websocket of ${displayname}`
        );
      }, timeoutDelay * 1000);
    } else if (msg.type != "ka") {
      msg = msg.payload.data.treasureChestMessageReceived;

      if (msg.type == "ValueUpdated") {
        const value = msg.value / 100000;
        const roundedValue = Math.round(value * 100) / 100;

        getStreamInfo(displayname)
          .then((response) => {
            let stream = response.userByDisplayName.livestream;
            let existingMsgId = alertHistory[guildId][displayname];
            editAlertMessage(
              displayname,
              stream,
              channelId,
              channelName,
              guildId,
              guildName,
              existingMsgId,
              (online = true),
              roundedValue
            );
          })
          .catch((err) => console.log(err));
      }
    }
  };

  cs.onclose = () => {
    console.log(
      "[WebSocket]",
      `${guildName} - Closing chest websocket of ${displayname}`
    );
  };

  return cs;
};

/**
 * Create a websocket to listen to the chat of the given streamer
 *
 * @param {string} displayname
 * @param {string} guildId
 * @param {string} channelId
 * @return {WebSocket}
 */
const createChatWebSocket = (displayname, guildId, channelId) => {
  const guildName = client.guilds.cache.get(guildId).name;
  const channelName = client.channels.cache.get(channelId).name;
  let ws = new WebSocket("wss://graphigostream.prd.dlive.tv/", "graphql-ws");

  /**
   * Initialize the chat websocket
   *
   */
  ws.onopen = () => {
    ws.send('{"type":"connection_init","payload":{}}');

    getUsername(displayname)
      .then((response) => {
        let username = response.userByDisplayName.username;
        let joinmsg = createJoinMsg(username, (chest = false));
        ws.send(JSON.stringify(joinmsg));
      })
      .then(() => getStreamInfo(displayname))
      .then((response) => {
        let stream = response.userByDisplayName.livestream;
        let isLive = !(stream == null);

        if (!wasLive[guildId][displayname] && isLive) {
          sendAlertMessage(
            displayname,
            stream,
            guildId,
            channelId,
            channelName,
            guildName
          );
        } else if (wasLive[guildId][displayname] && !isLive) {
          getStreamInfo(displayname)
            .then((response) => {
              let offlineImage = response.userByDisplayName.offlineImage;
              let stream = response.userByDisplayName.livestream;
              let existingMsgId = alertHistory[guildId][displayname];
              let permlink = vodPermlinks[guildId][displayname];
              editAlertMessage(
                displayname,
                stream,
                channelId,
                channelName,
                guildId,
                guildName,
                existingMsgId,
                (online = false),
                (chestValue = null),
                permlink,
                offlineImage
              );
            })
            .catch((err) => console.log(err));
        }
      })
      .catch((err) => console.log(err));
  };

  /**
   * Process messages from the chat websocket
   *
   * @param {*} msg
   */
  ws.onmessage = (msg) => {
    msg = JSON.parse(msg.data);

    if (msg.type == "connection_ack") {
      console.log(
        "[WebSocket]",
        `${guildName} - Connected to chat websocket of ${displayname}`
      );
    } else if (msg.type == "ka") {
      // The server sends a "ka" message every 25 seconds
      // https://docs.dlive.tv/api/api/subscription-web-socket
      clearTimeout(ws.pingTimeout);

      // Create a new connection if we don't receive
      // the "ka" message 2mins after the last one

      ws.pingTimeout = setTimeout(() => {
        ws.close();
        let newWs = createChatWebSocket(displayname, guildId, channelId);
        websockets[guildId].push(newWs);
        console.log(
          "[WebSocket]",
          `${guildName} - Restarting chat websocket of ${displayname}`
        );
      }, timeoutDelay * 1000);
    } else if (msg.type != "ka") {
      [msg] = msg.payload.data.streamMessageReceived;

      if (msg.type == "Live") {
        getStreamInfo(displayname)
          .then((response) => {
            let stream = response.userByDisplayName.livestream;
            sendAlertMessage(
              displayname,
              stream,
              guildId,
              channelId,
              channelName,
              guildName
            );
          })
          .catch((err) => console.log(err));
      } else if (msg.type == "Offline") {
        if (wasLive[guildId][displayname]) {
          getStreamInfo(displayname)
            .then((response) => {
              let offlineImage = response.userByDisplayName.offlineImage;
              let stream = response.userByDisplayName.livestream;
              let existingMsgId = alertHistory[guildId][displayname];
              let permlink = vodPermlinks[guildId][displayname];
              editAlertMessage(
                displayname,
                stream,
                channelId,
                channelName,
                guildId,
                guildName,
                existingMsgId,
                (online = false),
                (chestValue = null),
                permlink,
                offlineImage
              );
            })
            .catch((err) => console.log(err));
        }
      }
    }
  };

  ws.onclose = () => {
    console.log(
      "[WebSocket]",
      `${guildName} - Closing chat websocket of ${displayname}`
    );
  };

  return ws;
};

// ================= DISCORD BOT ===================
client.on("ready", () => {
  // Initialize the bot
  console.log("[Discord]", `Logged in as ${client.user.tag}!`);

  // Log last login time
  let now = moment().utc();
  fs.writeFile("logginTime.txt", now.tz(timezone).toString(), (error) => {
    if (error) throw err;
  });

  parseDatabase();
  /**
   * Retrieve previously set up alerts
   * and recreate the associated websockets
   * */
  for (let guildId in wasLive) {
    websockets[guildId] = [];
    for (let displayname in wasLive[guildId]) {
      let channelId = alertChannels[guildId];
      let ws = createChatWebSocket(displayname, guildId, channelId);
      let cs = createChestWebSocket(displayname, guildId, channelId);
      websockets[guildId].push(ws);
      websockets[guildId].push(cs);
    }
  }
  /* DEBUG to check bot permissions
  console.log(client.guilds.cache.get('676184666373357601').me.permissions.toArray())
  console.log(client.channels.cache.get('676185038446133284').permissionsFor(client.user).toArray())
  */
});

// Listen to discord messages
client.on("message", (msg) => {
  let isAdmin = msg.guild.member(msg.author).hasPermission("ADMINISTRATOR");

  if (isAdmin && msg.channel.name.includes("alerte")) {
    let guildId = msg.guild.id;
    let channelId = msg.channel.id;

    if (msg.content.startsWith("dbot_add")) {
      const inputs = msg.content.split(" ");
      let displayname = inputs[inputs.length - 1];

      if (!(guildId in wasLive)) {
        websockets[guildId] = [];
        wasLive[guildId] = {};
        alertHistory[guildId] = {};
        vodPermlinks[guildId] = {};
        alertChannels[guildId] = channelId;
        updateDatabase(wasLive, alertChannels, alertHistory, vodPermlinks);
      }
      if (displayname in wasLive[guildId]) {
        msg
          .reply(`Une alerte existe déjà pour ${displayname}`)
          .catch((error) => console.log(error));
      } else {
        wasLive[guildId][displayname] = false;
        updateDatabase(wasLive, alertChannels, alertHistory, vodPermlinks);

        let ws = createChatWebSocket(displayname, guildId, channelId);
        let cs = createChestWebSocket(displayname, guildId, channelId);
        websockets[guildId].push(ws);
        websockets[guildId].push(cs);

        msg
          .reply(`Alerte paramétrée pour ${displayname}`)
          .catch((error) => console.log(error));
      }
    } else if (msg.content == "dbot_clear") {
      if (websockets[guildId]) {
        websockets[guildId].forEach((ws) => {
          clearTimeout(ws.pingTimeout);
          ws.close();
        });
      }

      delete wasLive[guildId];
      delete alertChannels[guildId];
      delete alertHistory[guildId];
      delete vodPermlinks[guildId];
      updateDatabase(wasLive, alertChannels, alertHistory, vodPermlinks);

      msg
        .reply("Toutes les alertes ont été retirées")
        .catch((error) => console.log(error));
    } else if (msg.content == "dbot_get") {
      if (
        wasLive[guildId] == null ||
        Object.keys(wasLive[guildId]).length == 0
      ) {
        msg
          .reply("Aucune alerte paramétrée")
          .catch((error) => console.log(error));
      } else {
        msg
          .reply(
            `Alerte paramétrée pour le(s) streamer(s):\n${Object.keys(
              wasLive[guildId]
            ).join("\n")}`
          )
          .catch((error) => console.log(error));
      }
    } else if (msg.content == "dbot_help") {
      const help = new Discord.MessageEmbed()
        .setTitle("dlivebot")
        .setDescription(
          "Permet d'envoyer une notification sur le canal alerte lorsqu'un des streamers ajoutés commence un live"
        )
        .addField(
          "Qui peut paramétrer ce bot ?",
          "Les administrateurs du serveur"
        )
        .addField("Ajouter une alerte", "dbot_add <nom_du_streamer>", true)
        .addField("Exemple", "dbot_add Marvelfit", true)
        .addField("Voir les alertes existantes", "dbot_get")
        .addField("Retirer toutes les alertes", "dbot_clear");
      msg.reply(help).catch((error) => console.log(error));
    }
  }
});

// You really don't want your token here since your repl's code
// is publically available. We'll take advantage of a Repl.it
// feature to hide the token we got earlier.
client.login(process.env.DISCORD_TOKEN);
