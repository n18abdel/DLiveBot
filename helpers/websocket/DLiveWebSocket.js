const WebSocket = require("ws");

// delay in seconds without heartbeat
// after which the websockets are restarted
const timeoutDelay = 2 * 60;

class DLiveWebSocket {
  constructor(
    username,
    displayname,
    guildId,
    channelId,
    botState,
    { chest = false } = {}
  ) {
    this.chest = chest;
    this.username = username;
    this.displayname = displayname;
    this.guildId = guildId;
    this.channelId = channelId;
    const { client, wasLive, alertHistory } = botState;
    Object.assign(this, { client, wasLive, alertHistory });
    this.guildName = client.guilds.cache.get(guildId).name;
    this.channelName = client.channels.cache.get(channelId).name;
    this.botState = botState;
  }

  init() {
    this.socket = new WebSocket(
      "wss://graphigostream.prd.dlive.tv/",
      "graphql-ws"
    );
    this.onclose();
  }

  joinMsg() {
    return {
      id: "1",
      type: "start",
      payload: {
        query: `subscription{${
          this.chest ? "treasureChestMessageReceived" : "streamMessageReceived"
        }(streamer:"${this.username}"){__typename}}`,
      },
    };
  }

  open() {
    this.socket.send('{"type":"connection_init","payload":{}}');
    this.socket.send(JSON.stringify(this.joinMsg()));
  }

  onopen() {
    this.socket.onopen = () => {
      this.open();
    };
  }

  onceopen() {
    console.log(
      "[WebSocket]",
      `${this.guildName} - Connected to ${
        this.chest ? "chest" : "chat"
      } websocket of ${this.displayname}`
    );
  }

  message(rawMsg) {
    const msg = JSON.parse(rawMsg.data);

    if (msg.type === "connection_ack") {
      this.onceopen();
    } else if (msg.type === "ka") {
      this.heartbeat();
    } else {
      return msg;
    }
  }

  onclose() {
    this.socket.onclose = () => {
      console.log(
        "[WebSocket]",
        `${this.guildName} - Closing ${
          this.chest ? "chest" : "chat"
        } websocket of ${this.displayname}`
      );
    };
  }

  heartbeat() {
    // The server sends a "ka" message every 25 seconds
    // https://docs.dlive.tv/api/api/subscription-web-socket
    clearTimeout(this.socket.pingTimeout);

    // Create a new connection if we don't receive
    // the "ka" message 2mins after the last one
    this.socket.pingTimeout = setTimeout(() => {
      this.socket.terminate();
      this.init();
      console.log(
        "[WebSocket]",
        `${this.guildName} - Restarting ${
          this.chest ? "chest" : "chat"
        } websocket of ${this.displayname}`
      );
    }, timeoutDelay * 1000);
  }

  close() {
    clearTimeout(this.socket.pingTimeout);
    this.socket.terminate();
  }
}

module.exports = DLiveWebSocket;
