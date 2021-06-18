const https = require("https");
const WebSocket = require("ws");
const moment = require("moment-timezone");

const { updateDatabase } = require("./db");
const { sendAlertMessage, editAlertMessage } = require("./message");

// delay in seconds without heartbeat
// after which the websockets are restarted
const timeoutDelay = 2 * 60;

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
    const { operationName, ...toPost } = data;
    const postData = JSON.stringify(toPost);
    const req = https.request(requestOptions, (res) => {
      res.setEncoding("utf-8");
      res.on("data", (responseText) => {
        const response = JSON.parse(responseText).data;
        resolve(response[operationName]);
      });
      res.on("error", (error) => reject(error));
    });
    req.write(postData);
    req.end();
  });

/**
 * Retrieve the DLive username (different than displayname)
 *
 * @param {string} displayname
 */
const getUsername = (displayname) =>
  request({
    operationName: "userByDisplayName",
    query: `query LivestreamPage($displayname: String!) {
      userByDisplayName(displayname: $displayname) {
        username
        __typename
      }
    }`,
    variables: {
      displayname,
    },
  }).then((user) => (user ? user.username : null));

/**
 * Retrieve the DLive displayname (different than username)
 *
 * @param {string} username
 */
const getDisplayname = (username) =>
  request({
    operationName: "user",
    query: `query User($username: String!) {
      user(username: $username) {
        displayname
        __typename
      }
    }`,
    variables: {
      username,
    },
  }).then((user) => user.displayname);

/**
 * Retrieve current stream info
 *
 * @param {string} username
 */
const getStreamInfo = (username) =>
  request({
    operationName: "user",
    query: `query LivestreamPage($username: String!) {
      user(username: $username) {
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
        displayname
        __typename
      }
    }`,
    variables: {
      username,
    },
  });
/**
 * Create message to start websocket connection
 *
 * @param {string} username - username of the streamer (different than displayname)
 * @param {boolean} chest - whether to subscribe to chest or chat
 * @return {object}
 */
const createJoinMsg = (username, { chest = false } = {}) => {
  if (chest) {
    return {
      id: "1",
      type: "start",
      payload: {
        query: `subscription{treasureChestMessageReceived(streamer:"${username}"){__typename}}`,
      },
    };
  }
  return {
    id: "1",
    type: "start",
    payload: {
      query: `subscription{streamMessageReceived(streamer:"${username}"){__typename}}`,
    },
  };
};
/**
 * Create a websocket to listen to the chest of the given streamer
 *
 * @param {string} username
 * @param {string} displayname
 * @param {string} guildId
 * @param {string} channelId
 * @param {object} botState
 * @return {WebSocket}
 */
const createChestWebSocket = (
  username,
  displayname,
  guildId,
  channelId,
  botState
) => {
  const { client, wasLive, alertHistory, websockets } = botState;
  const guildName = client.guilds.cache.get(guildId).name;
  const channelName = client.channels.cache.get(channelId).name;
  const cs = new WebSocket("wss://graphigostream.prd.dlive.tv/", "graphql-ws");

  /**
   * Initialize the chest websocket
   *
   */
  cs.onopen = () => {
    cs.send('{"type":"connection_init","payload":{}}');

    const joinmsg = createJoinMsg(username, { chest: true });
    cs.send(JSON.stringify(joinmsg));
  };

  const updateChestValue = (msg) => {
    const value = msg.value / 100000;
    const roundedValue = Math.round(value * 100) / 100;

    getStreamInfo(username)
      .then((user) => {
        const { livestream: stream } = user;
        if (wasLive[guildId][username]) {
          const existingMsgId = alertHistory[guildId][username];

          editAlertMessage(
            {
              displayname,
              username,
              stream,
              channelId,
              channelName,
              guildId,
              guildName,
              existingMsgId,
              online: true,
              chestValue: roundedValue,
            },
            botState
          );
        } else {
          const isLive = !(stream == null);
          if (isLive) {
            // there was a bug, the streamer went live without any sent alert

            sendAlertMessage(
              displayname,
              username,
              stream,
              guildId,
              channelId,
              channelName,
              guildName,
              botState
            );
          }
        }
      })
      .catch((err) => console.log(err));
  };

  /**
   * Process messages from the chest websocket
   *
   * @param {*} rawMsg
   */
  cs.onmessage = (rawMsg) => {
    const msg = JSON.parse(rawMsg.data);

    if (msg.type === "connection_ack") {
      console.log(
        "[WebSocket]",
        `${guildName} - Connected to chest websocket of ${displayname}`
      );
    } else if (msg.type === "ka") {
      // The server sends a "ka" message every 25 seconds
      // https://docs.dlive.tv/api/api/subscription-web-socket
      clearTimeout(cs.pingTimeout);

      // Create a new connection if we don't receive
      // the "ka" message 2mins after the last one
      cs.pingTimeout = setTimeout(() => {
        cs.terminate();
        const newCs = createChestWebSocket(
          username,
          displayname,
          guildId,
          channelId
        );
        websockets[guildId].push(newCs);
        console.log(
          "[WebSocket]",
          `${guildName} - Restarting chest websocket of ${displayname}`
        );
      }, timeoutDelay * 1000);
    } else if (msg.type !== "ka") {
      const innerMsg = msg.payload.data.treasureChestMessageReceived;

      if (innerMsg.type === "ValueUpdated") {
        updateChestValue(innerMsg);
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
 * @param {string} username
 * @param {string} displayname
 * @param {string} guildId
 * @param {string} channelId
 * @param {object} botState
 * @return {WebSocket}
 */
const createChatWebSocket = (
  username,
  displayname,
  guildId,
  channelId,
  botState
) => {
  const {
    client,
    settings,
    wasLive,
    alertHistory,
    lastStreams,
    alertChannels,
    websockets,
  } = botState;
  const guildName = client.guilds.cache.get(guildId).name;
  const channelName = client.channels.cache.get(channelId).name;
  const ws = new WebSocket("wss://graphigostream.prd.dlive.tv/", "graphql-ws");

  /**
   * Check whether a stream with the same title
   * ended "not so long" ago (global parameter sameTitleDelay)
   *
   * @param {object} stream
   * @return {boolean}
   */
  const sameTitleWithinDelay = (stream) =>
    stream.title === lastStreams[guildId][username].title &&
    moment
      .duration(
        moment
          .unix(Number(stream.createdAt) / 1000)
          .diff(
            moment.unix(
              Number(lastStreams[guildId][username].finishedAt) / 1000
            )
          )
      )
      .as("minutes") < settings.sameTitleDelay;

  /**
   * Send a new alert message
   * or edit an existing one
   *
   * @param {object} stream
   */
  const newAlertOrExistingOne = (stream) => {
    if (
      lastStreams[guildId][username] &&
      (stream.permlink === lastStreams[guildId][username].permlink ||
        sameTitleWithinDelay(stream))
    ) {
      /**
       * there was a bug the stream went off and back up
       * or
       * there was a stream with the same title not "so long ago"
       */
      const existingMsgId = alertHistory[guildId][username];

      editAlertMessage(
        {
          displayname,
          username,
          stream,
          channelId,
          channelName,
          guildId,
          guildName,
          existingMsgId,
          online: true,
        },
        botState
      ).then(async () => {
        wasLive[guildId][username] = true;
        await updateDatabase(
          wasLive,
          alertChannels,
          alertHistory,
          lastStreams,
          settings
        );
      });
    } else {
      sendAlertMessage(
        displayname,
        username,
        stream,
        guildId,
        channelId,
        channelName,
        guildName,
        botState
      );
    }
  };

  let goLiveLoop = 0;
  const streamerGoLive = () =>
    getStreamInfo(username)
      .then((user) => {
        const { livestream: stream } = user;
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
    getStreamInfo(username)
      .then((user) => {
        const {
          lastStreamedAt: finishedAt,
          offlineImage,
          livestream: stream,
        } = user;
        const existingMsgId = alertHistory[guildId][username];
        const { permlink } = lastStreams[guildId][username];

        editAlertMessage(
          {
            displayname,
            username,
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
          },
          botState
        );
      })
      .catch((err) => console.log(err));

  /**
   * Initialize the chat websocket
   *
   */
  ws.onopen = () => {
    ws.send('{"type":"connection_init","payload":{}}');

    const joinmsg = createJoinMsg(username, { chest: false });
    ws.send(JSON.stringify(joinmsg));

    getStreamInfo(username)
      .then((user) => {
        const { livestream: stream } = user;
        const isLive = !(stream == null);

        if (!wasLive[guildId][username] && isLive) {
          newAlertOrExistingOne(stream);
        } else if (wasLive[guildId][username] && !isLive) {
          streamerGoOffline();
        }
      })
      .catch((err) => console.log(err));
  };

  /**
   * Process messages from the chat websocket
   *
   * @param {*} rawMsg
   */
  ws.onmessage = (rawMsg) => {
    const msg = JSON.parse(rawMsg.data);

    if (msg.type === "connection_ack") {
      console.log(
        "[WebSocket]",
        `${guildName} - Connected to chat websocket of ${displayname}`
      );
    } else if (msg.type === "ka") {
      // The server sends a "ka" message every 25 seconds
      // https://docs.dlive.tv/api/api/subscription-web-socket
      clearTimeout(ws.pingTimeout);

      // Create a new connection if we don't receive
      // the "ka" message 2mins after the last one
      ws.pingTimeout = setTimeout(() => {
        ws.terminate();
        const newWs = createChatWebSocket(
          username,
          displayname,
          guildId,
          channelId
        );
        websockets[guildId].push(newWs);
        console.log(
          "[WebSocket]",
          `${guildName} - Restarting chat websocket of ${displayname}`
        );
      }, timeoutDelay * 1000);
    } else if (msg.type !== "ka") {
      const [innerMsg] = msg.payload.data.streamMessageReceived;

      if (innerMsg.type === "Live") {
        streamerGoLive();
      } else if (innerMsg.type === "Offline") {
        if (wasLive[guildId][username]) {
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

const closeWebsockets = async (websockets, guildId) => {
  if (websockets[guildId]) {
    websockets[guildId].forEach((ws) => {
      clearTimeout(ws.pingTimeout);
      ws.terminate();
    });
  }
};

module.exports = {
  createChatWebSocket,
  createChestWebSocket,
  getUsername,
  getDisplayname,
  closeWebsockets,
};
