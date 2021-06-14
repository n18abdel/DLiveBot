const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => res.send("dlivebot is alive!"));

app.listen(port);

// ================= START BOT CODE ===================
const Discord = require("discord.js");
const client = new Discord.Client();

const https = require("https");
const WebSocket = require("ws");

const moment = require("moment-timezone");
const timezone = "Europe/Paris";

const admin = require("firebase-admin");

const serviceAccount = {
  type: process.env.type,
  project_id: process.env.project_id,
  private_key_id: process.env.private_key_id,
  private_key: process.env.private_key,
  client_email: process.env.client_email,
  client_id: process.env.client_id,
  auth_uri: process.env.auth_uri,
  token_uri: process.env.token_uri,
  auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.client_x509_cert_url,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * delay in minutes: (put 0 to disable)
 * if two streams 1 and 2 with the same title start successively
 * and startTimeStream2 - endTimeStream1 < sameTitleDelay
 * then only one alert message will be sent
 */
const sameTitleDelayDefault = 5;

// color used for Discord embed messages
const colorDefault = "#ffd300";

/**
 * referral username to use
 * (username is different than the displayname
 *  - we can change displayname monthly
 *    but the username is fixed)
 *
 * you can use the command dbot_get_username <displayname>
 * (displayname is what you see on DLive)
 */
const referralUsernameDefault = "son-son";

// footer for alert messages
const footerDefault = "Provided by Son Son Association Enterprise®";

// message to display when the stream goes on
const onlineMessageDefault = "Hey @everyone <displayname> est en direct";

// message to display on the embed message when the stream goes off
const offlineMessageDefault =
  "Le stream est fini :yeshaha:" +
  "\n" +
  "À la prochaine kaiser :sourire:" +
  "\n\n" +
  "Clique sur le lien pour voir la rediff :ohhhhh:";

// title to display on the message embed alert, when the stream is on
const titleOnlineDefault =
  ":red_circle: **<displayname> est en direct sur DLive !**";

// title to display on the message embed, when the stream is off
const titleOfflineDefault =
  ":white_circle: **<displayname> était en direct sur DLive**";

// one of those values is chosen, each time the chest value is updated
const chestNamesDefault = ["Coffrio", "El coffro", "El coffrito"];

const paramsDefault = {
  sameTitleDelay: sameTitleDelayDefault,
  color: colorDefault,
  referralUsername: referralUsernameDefault,
  footer: footerDefault,
  onlineMessage: onlineMessageDefault,
  offlineMessage: offlineMessageDefault,
  titleOnline: titleOnlineDefault,
  titleOffline: titleOfflineDefault,
  chestNames: chestNamesDefault,
};
let params = paramsDefault;

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

/** {guildId: {streamerDisplayname: stream}}
 * Latest streams with sent alert
 */
let lastStreams = {};

// ================= ALERT MESSAGE HELPERS ===================

/**
 * Message sent on discord when an added streamer goes live
 *
 * @param {string} displayname
 * @param {string} guildId
 * @return {string}
 */
const getAlertMessage = (displayname, guildId) => {
  return processMessage(params.onlineMessage, guildId, displayname);
};

/**
 * Process input message, and retrieve custom emojis,
 * and replace displayname parameter with value
 *
 * @param {string} message
 * @param {string} guildId
 * @param {string} displayname
 * @return {string}
 */
const processMessage = (message, guildId, displayname) => {
  let processedMessage = message;
  processedMessage = processedMessage.replace(/<displayname>/g, displayname);
  const emojis = message.matchAll(/:(.+?):/g);

  retrievedEmojis = {};
  for (let emoji of emojis) {
    const emojiName = emoji[1];
    if (!retrievedEmojis[emojiName]) {
      const retrievedEmoji = client.guilds.cache
        .get(guildId)
        .emojis.cache.find((emoji) => emoji.name == emojiName);

      if (retrievedEmoji) {
        retrievedEmojis[emojiName] = retrievedEmoji;
      }
    }
  }
  for (let emoji in retrievedEmojis) {
    const toReplace = `:${emoji}:`;
    const regex = new RegExp(toReplace, "g");
    processedMessage = processedMessage.replace(regex, retrievedEmojis[emoji]);
  }

  return processedMessage;
};

/**
 * Message options for the alert sent on discord
 *
 * @param {object}
 * @return {object}
 */
const getAlertMessageOptions = ({
  displayname,
  stream,
  online,
  chestValue,
  permlink,
  guildId,
  offlineImage,
}) => {
  const msgEmbed = new Discord.MessageEmbed()
    .setColor(params.color)
    .setFooter(processMessage(params.footer, guildId, displayname));

  if (online) {
    const now = moment();
    const startedAt = moment.unix(Number(stream.createdAt) / 1000);
    const duration = moment.duration(now.diff(startedAt));
    const hours = duration.hours();
    const minutes = duration.minutes();

    let streamReward = Number(stream.totalReward) / 100000;
    streamReward =
      streamReward > 1000
        ? `${Math.round((streamReward / 1000) * 100) / 100}K`
        : Math.round(streamReward * 100) / 100;

    let viewers = Number(stream.watchingCount);
    viewers =
      viewers > 1000 ? `${Math.round((viewers / 1000) * 10) / 10}K` : viewers;

    msgEmbed
      .setTitle(processMessage(params.titleOnline, guildId, displayname))
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
      .setURL(`https://dlive.tv/${displayname}?ref=${params.referralUsername}`);
    if (chestValue) {
      const chestNames = params.chestNames;
      const ind = Math.floor(Math.random() * chestNames.length);
      msgEmbed.addField(chestNames[ind], `${chestValue} :lemon:`, true);
    }
  } else {
    msgEmbed
      .setTitle(processMessage(params.titleOffline, guildId, displayname))
      .setDescription(
        processMessage(params.offlineMessage, guildId, displayname)
      )
      .setImage(offlineImage)
      .setURL(`https://dlive.tv/p/${permlink}?ref=${params.referralUsername}`);
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
      getAlertMessage(displayname, guildId),
      getAlertMessageOptions({
        displayname,
        stream,
        online: true,
        guildId,
      })
    )
    .then(async (message) => {
      console.log(
        "[Discord]",
        `Sent announce msg to #${channelName} on ${guildName} for ${displayname}`
      );

      wasLive[guildId][displayname] = true;
      alertHistory[guildId][displayname] = message.id;
      lastStreams[guildId][displayname] = selectTitlePermlink(stream);
      await updateDatabase(
        wasLive,
        alertChannels,
        alertHistory,
        lastStreams,
        params
      );
    })
    .catch((error) => console.log(error));
};

/**
 * Edit existing alert message with updates
 *
 * @param {object}
 */
const editAlertMessage = ({
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
  offlineImage,
  finishedAt,
}) =>
  client.channels.cache
    .get(channelId)
    .messages.fetch(existingMsgId)
    .then((existingMsg) => {
      existingMsg.edit(
        getAlertMessage(displayname, guildId),
        getAlertMessageOptions({
          displayname,
          stream,
          online,
          chestValue,
          permlink,
          guildId,
          offlineImage,
        })
      );
    })
    .then(async (message) => {
      console.log(
        "[Discord]",
        `Edited announce msg to #${channelName} on ${guildName} for ${displayname}`
      );
      if (permlink) {
        // when the streamer goes offline
        wasLive[guildId][displayname] = false;
        lastStreams[guildId][displayname]["finishedAt"] = finishedAt;
        await updateDatabase(
          wasLive,
          alertChannels,
          alertHistory,
          lastStreams,
          params
        );
      } else {
        // the stream is still up
        if (stream.title != lastStreams[guildId][displayname]) {
          lastStreams[guildId][displayname].title = stream.title;
          await updateDatabase(
            wasLive,
            alertChannels,
            alertHistory,
            lastStreams,
            params
          );
        }
      }
    })
    .catch((error) => console.log(error));

// ================= BOT STATE DB HELPERS ===================

/**
 * Retrieve the previous state of the bot from Cloud Firestore database
 *
 */
const parseDatabase = async () => {
  wasLive = await db.collection("dlivebot").doc("wasLive").get();
  wasLive = wasLive.data();
  alertChannels = await db.collection("dlivebot").doc("alertChannels").get();
  alertChannels = alertChannels.data();
  alertHistory = await db.collection("dlivebot").doc("alertHistory").get();
  alertHistory = alertHistory.data();
  lastStreams = await db.collection("dlivebot").doc("lastStreams").get();
  lastStreams = lastStreams.data();
  params = await db.collection("dlivebot").doc("params").get();
  params = params.data();
  if (
    wasLive == null ||
    alertChannels == null ||
    alertHistory == null ||
    lastStreams == null ||
    params == null ||
    !Object.keys(paramsDefault).every((element) =>
      Object.keys(params).includes(element)
    )
  ) {
    await updateDatabase({}, {}, {}, {}, paramsDefault);
    await parseDatabase();
  }
};

/**
 * Update the Cloud Firestore database with the current state of the bot
 *
 * @param {object} wasLive
 * @param {object} alertChannels
 * @param {object} alertHistory
 * @param {object} lastStreams
 * @param {object} params
 */
const updateDatabase = async (
  wasLive,
  alertChannels,
  alertHistory,
  lastStreams,
  params
) => {
  await db.collection("dlivebot").doc("wasLive").set(wasLive);
  await db.collection("dlivebot").doc("alertChannels").set(alertChannels);
  await db.collection("dlivebot").doc("alertHistory").set(alertHistory);
  await db.collection("dlivebot").doc("lastStreams").set(lastStreams);
  await db.collection("dlivebot").doc("params").set(params);
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
        lastStreamedAt
        offlineImage
        __typename
      }
    }`,
    variables: {
      displayname,
    },
  });

/**
 * Return only the properties title and permlink
 * from the input stream object
 *
 * @param {object} stream
 * @return {object}
 */
const selectTitlePermlink = ({ title, permlink }) => ({ title, permlink });

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

  const updateChestValue = (msg) => {
    const value = msg.value / 100000;
    const roundedValue = Math.round(value * 100) / 100;

    getStreamInfo(displayname)
      .then((response) => {
        let stream = response.userByDisplayName.livestream;
        if (wasLive[guildId][displayname]) {
          let existingMsgId = alertHistory[guildId][displayname];
          editAlertMessage({
            displayname,
            stream,
            channelId,
            channelName,
            guildId,
            guildName,
            existingMsgId,
            online: true,
            roundedValue,
          });
        } else {
          let isLive = !(stream == null);
          if (isLive) {
            // there was a bug, the streamer went live without any sent alert
            sendAlertMessage(
              displayname,
              stream,
              guildId,
              channelId,
              channelName,
              guildName
            );
          }
        }
      })
      .catch((err) => console.log(err));
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
        cs.terminate();
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
        updateChestValue(msg);
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
          newAlertOrExistingOne(stream);
        } else if (wasLive[guildId][displayname] && !isLive) {
          streamerGoOffline();
        }
      })
      .catch((err) => console.log(err));
  };

  /**
   * Check whether a stream with the same title
   * ended "not so long" ago (global parameter sameTitleDelay)
   *
   * @param {object} stream
   * @return {boolean}
   */
  const sameTitleWithinDelay = (stream) =>
    stream.title == lastStreams[guildId][displayname].title &&
    moment
      .duration(
        moment
          .unix(Number(stream.createdAt) / 1000)
          .diff(
            moment.unix(
              Number(lastStreams[guildId][displayname].finishedAt) / 1000
            )
          )
      )
      .as("minutes") < params.sameTitleDelay;

  /**
   * Send a new alert message
   * or edit an existing one
   *
   * @param {object} stream
   */
  const newAlertOrExistingOne = (stream) => {
    if (
      lastStreams[guildId][displayname] &&
      (stream.permlink == lastStreams[guildId][displayname].permlink ||
        sameTitleWithinDelay(stream))
    ) {
      /**
       * there was a bug the stream went off and back up
       * or
       * there was a stream with the same title not "so long ago"
       */

      let existingMsgId = alertHistory[guildId][displayname];
      editAlertMessage({
        displayname,
        stream,
        channelId,
        channelName,
        guildId,
        guildName,
        existingMsgId,
        online: true,
      }).then(async () => {
        wasLive[guildId][displayname] = true;
        -(await updateDatabase(
          wasLive,
          alertChannels,
          alertHistory,
          lastStreams,
          params
        ));
      });
    } else {
      sendAlertMessage(
        displayname,
        stream,
        guildId,
        channelId,
        channelName,
        guildName
      );
    }
  };

  let goLiveLoop = 0;
  const streamerGoLive = () =>
    getStreamInfo(displayname)
      .then((response) => {
        let stream = response.userByDisplayName.livestream;
        if (!stream && goLiveLoop < 15) {
          /**
           * stream shouldn't be null as the streamer went live
           * so we retry the query for 15s
           * otherwise that would lead to double ping
           * as we couldn't check that it's a new stream
           * using stream.permlink (unique ID of a stream)
           */
          goLiveLoop += 1;
          setTimeout(() => streamerGoLive(), 1000);
        } else {
          goLiveLoop = 0;
          newAlertOrExistingOne(stream);
        }
      })
      .catch((err) => console.log(err));

  const streamerGoOffline = () =>
    getStreamInfo(displayname)
      .then((response) => {
        let finishedAt = response.userByDisplayName.lastStreamedAt;
        let offlineImage = response.userByDisplayName.offlineImage;
        let stream = response.userByDisplayName.livestream;
        let existingMsgId = alertHistory[guildId][displayname];
        let permlink = lastStreams[guildId][displayname].permlink;
        editAlertMessage({
          displayname,
          stream,
          channelId,
          channelName,
          guildId,
          guildName,
          existingMsgId,
          online: false,
          permlink,
          offlineImage,
          finishedAt,
        });
      })
      .catch((err) => console.log(err));

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
        ws.terminate();
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
        streamerGoLive();
      } else if (msg.type == "Offline") {
        if (wasLive[guildId][displayname]) {
          streamerGoOffline();
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
client.on("ready", async () => {
  // Initialize the bot
  console.log("[Discord]", `Logged in as ${client.user.tag}!`);

  // Log last login time
  const maxLoginsToLog = 10;
  const loginTime = moment().tz(timezone);
  const loginTimeRef = db.collection("dlivebot").doc("loginTime");
  loginTimeRef.get().then((docSnapshot) => {
    let loginTimeObj;
    if (docSnapshot.exists) {
      loginTimeObj = docSnapshot.data();
      while (Object.keys(loginTimeObj).length >= maxLoginsToLog) {
        const keyToRemove = Object.keys(loginTimeObj).sort(
          (a, b) => Number(a) - Number(b)
        )[0];
        delete loginTimeObj[keyToRemove];
      }
    } else {
      loginTimeObj = {};
    }
    loginTimeObj[loginTime.unix()] = loginTime.toString();
    loginTimeRef.set(loginTimeObj);
  });

  await parseDatabase();
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
  const guildIdToCheck = "<toFill>"
  const channelIdToCheck = "<toFill>"
  console.log(client.guilds.cache.get(guildIdToCheck).me.permissions.toArray())
  console.log(client.channels.cache.get(channelIdToCheck).permissionsFor(client.user).toArray())
  */
});

// Listen to discord messages
client.on("message", async (msg) => {
  let isAdmin = msg.guild.member(msg.author).hasPermission("ADMINISTRATOR");
  const delayExplainer =
    "Si le délai entre la fin d'un stream, et le début d'un nouveau stream avec le même titre est inférieur au délai paramétré :" +
    "\n" +
    "__*startTimeStream2 - endTimeStream1 < sameTitleDelay*__" +
    "\n" +
    ":arrow_forward: il n'y aura pas de nouvelle alerte, l'ancienne alerte sera éditée à la place";

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
        lastStreams[guildId] = {};
        alertChannels[guildId] = channelId;
        await updateDatabase(
          wasLive,
          alertChannels,
          alertHistory,
          lastStreams,
          params
        );
      }
      if (displayname in wasLive[guildId]) {
        msg
          .reply(`Une alerte existe déjà pour ${displayname}`)
          .catch((error) => console.log(error));
      } else {
        wasLive[guildId][displayname] = false;
        await updateDatabase(
          wasLive,
          alertChannels,
          alertHistory,
          lastStreams,
          params
        );

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
        params
      );

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
    } else if (msg.content.startsWith("dbot_set_delay")) {
      const inputs = msg.content.split(" ");
      let delay = inputs[inputs.length - 1];

      params.sameTitleDelay = Number(delay);
      await updateDatabase(
        wasLive,
        alertChannels,
        alertHistory,
        lastStreams,
        params
      );
      if (params.sameTitleDelay <= 0) {
        answer = "Le délai est maintenant désactivé";
      } else {
        answer = `Le délai paramétré est maintenant de ${params.sameTitleDelay} minutes\n\n${delayExplainer}`;
      }
      msg.reply(answer).catch((error) => console.log(error));
    } else if (msg.content.startsWith("dbot_get_delay")) {
      let answer;
      if (params.sameTitleDelay <= 0) {
        answer = "Il n'y a pas de délai paramétré";
      } else {
        answer = `Le délai paramétré est de ${params.sameTitleDelay} minutes\n\n${delayExplainer}`;
      }
      msg.reply(answer).catch((error) => console.log(error));
    } else if (msg.content.startsWith("dbot_get_username")) {
      const inputs = msg.content.split(" ");
      const displayname = inputs[inputs.length - 1];

      getUsername(displayname)
        .then((response) => {
          if (response.userByDisplayName) {
            const username = response.userByDisplayName.username;
            msg.reply(`L'username de ${displayname} est:\n${username}`);
          } else {
            msg.reply(
              `Aucun username a été trouvé pour ${displayname}\nVérifiez votre saisie`
            );
          }
        })
        .catch((error) => console.log(error));
    } else if (msg.content == "dbot_help") {
      const help = new Discord.MessageEmbed()
        .setTitle("DLiveBot")
        .setColor(params.color)
        .setDescription(
          "Permet d'envoyer une notification sur le canal alerte lorsqu'un des streamers ajoutés commence un live"
        )
        .addField("\u200b", "\u200b")
        .addField(
          "Qui peut paramétrer ce bot ?",
          "Les administrateurs du serveur"
        )
        .addField("\u200b", "\u200b")
        .addField("Ajouter une alerte", "dbot_add <nom_du_streamer>", true)
        .addField("Exemple", "dbot_add Marvelfit", true)
        .addField("Voir les alertes existantes", "dbot_get")
        .addField("Retirer toutes les alertes", "dbot_clear")
        .addField("\u200b", "\u200b") // blank field
        .addField("Trouver l'username d'une personne", "dbot_get_username", true)
        .addField("Exemple", "dbot_get_username <displayname>", true)
        .addField("\u200b", "\u200b")
        .addField("Voir le délai paramétré", "dbot_get_delay")
        .addField("Modifier le délai", "dbot_set_delay", true)
        .addField("Exemple", "dbot_set_delay 10", true)
        .addField("À propos du délai", delayExplainer);
      msg.reply(help).catch((error) => console.log(error));
    }
  }
});

// You really don't want your token here since your repl's code
// is publically available. We'll take advantage of a Repl.it
// feature to hide the token we got earlier.
client.login(process.env.DISCORD_TOKEN);
