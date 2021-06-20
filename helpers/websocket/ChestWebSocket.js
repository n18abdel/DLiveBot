const DLiveWebSocket = require("./DLiveWebSocket");
const { getStreamInfo } = require("../request");
const { sendAlertMessage, editAlertMessage } = require("../message");

class ChestWebSocket extends DLiveWebSocket {
  constructor(username, displayname, guildId, channelId, botState) {
    super(username, displayname, guildId, channelId, botState, { chest: true });
    this.init();
  }

  init() {
    super.init();
    this.onopen();
    this.onmessage();
  }

  updateChestValue(msg) {
    const value = msg.value / 100000;
    const roundedValue = Math.round(value * 100) / 100;

    getStreamInfo(this.username)
      .then((user) => {
        const { livestream: stream } = user;
        if (this.wasLive[this.guildId][this.username]) {
          const existingMsgId = this.alertHistory[this.guildId][this.username];

          editAlertMessage(
            {
              displayname: this.displayname,
              username: this.username,
              stream,
              channelId: this.channelId,
              channelName: this.channelName,
              guildId: this.guildId,
              guildName: this.guildName,
              existingMsgId,
              online: true,
              chestValue: roundedValue,
            },
            this.botState
          );
        } else {
          const isLive = !(stream == null);
          if (isLive) {
            // there was a bug, the streamer went live without any sent alert

            sendAlertMessage(
              this.displayname,
              this.username,
              stream,
              this.guildId,
              this.channelId,
              this.channelName,
              this.guildName,
              this.botState
            );
          }
        }
      })
      .catch((err) => console.log(err));
  }

  onmessage() {
    this.socket.onmessage = (rawMsg) => {
      const msg = this.message(rawMsg);

      if (msg) {
        const innerMsg = msg.payload.data.treasureChestMessageReceived;

        if (innerMsg.type === "ValueUpdated") {
          this.updateChestValue(innerMsg);
        }
      }
    };
  }
}

module.exports = ChestWebSocket;
