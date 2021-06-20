const moment = require("moment-timezone");
const DLiveWebSocket = require("./DLiveWebSocket");
const { getStreamInfo } = require("../request");
const { sendAlertMessage, editAlertMessage } = require("../message");
const { updateDatabase } = require("../db");

class ChatWebSocket extends DLiveWebSocket {
  constructor(username, displayname, guildId, channelId, botState) {
    super(username, displayname, guildId, channelId, botState, {
      chest: false,
    });
    const { lastStreams, alertChannels, settings } = botState;
    Object.assign(this, { lastStreams, alertChannels, settings });
    this.goLiveLoop = 0;
    this.init();
  }

  init() {
    super.init();
    this.onopen();
    this.onmessage();
  }

  sameTitleWithinDelay(stream) {
    return (
      stream.title === this.lastStreams[this.guildId][this.username].title &&
      moment
        .duration(
          moment(Number(stream.createdAt))
            .unix()
            .diff(
              moment(
                Number(this.lastStreams[this.guildId][this.username].finishedAt)
              ).unix()
            )
        )
        .as("minutes") < this.settings[this.guildId].sameTitleDelay
    );
  }

  newAlertOrExistingOne(stream) {
    if (
      this.lastStreams[this.guildId][this.username] &&
      (stream.permlink ===
        this.lastStreams[this.guildId][this.username].permlink ||
        this.sameTitleWithinDelay(stream))
    ) {
      /**
       * there was a bug the stream went off and back up
       * or
       * there was a stream with the same title not "so long ago"
       */
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
        },
        this.botState
      ).then(async () => {
        this.wasLive[this.guildId][this.username] = true;
        await updateDatabase(
          this.wasLive,
          this.alertChannels,
          this.alertHistory,
          this.lastStreams,
          this.settings
        );
      });
    } else {
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

  async streamerGoLive() {
    try {
      const user = await getStreamInfo(this.username);
      const { livestream: stream } = user;
      if (!stream && this.goLiveLoop < 15) {
        /**
         * stream shouldn't be null as the streamer went live
         * so we retry the query for 15s
         * otherwise that would lead to double ping
         * as we couldn't check that it's a new stream
         * using stream.permlink (unique ID of a stream)
         */
        this.goLiveLoop += 1;
        setTimeout(() => this.streamerGoLive(), 1000);
      } else {
        this.goLiveLoop = 0;
        this.newAlertOrExistingOne(stream);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async streamerGoOffline() {
    try {
      const user = await getStreamInfo(this.username);
      const {
        lastStreamedAt: finishedAt,
        offlineImage,
        livestream: stream,
      } = user;
      const existingMsgId = this.alertHistory[this.guildId][this.username];
      const { permlink } = this.lastStreams[this.guildId][this.username];

      editAlertMessage(
        {
          displayname: this.displayname,
          username: this.username,
          stream,
          channelId: this.channelId,
          channelName: this.channelId,
          guildId: this.guildId,
          guildName: this.guildName,
          existingMsgId,
          online: false,
          permlink,
          offlineImage,
          finishedAt,
        },
        this.botState
      );
    } catch (err) {
      console.log(err);
    }
  }

  onopen() {
    this.socket.onopen = () => {
      this.open();
      getStreamInfo(this.username)
        .then((user) => {
          const { livestream: stream } = user;
          const isLive = !(stream == null);

          if (!this.wasLive[this.guildId][this.username] && isLive) {
            this.newAlertOrExistingOne(stream);
          } else if (this.wasLive[this.guildId][this.username] && !isLive) {
            this.streamerGoOffline();
          }
        })
        .catch((err) => console.log(err));
    };
  }

  onmessage() {
    this.socket.onmessage = (rawMsg) => {
      const msg = this.message(rawMsg);

      if (msg) {
        const [innerMsg] = msg.payload.data.streamMessageReceived;

        if (innerMsg.type === "Live") {
          this.streamerGoLive();
        } else if (innerMsg.type === "Offline") {
          if (this.wasLive[this.guildId][this.username]) {
            this.streamerGoOffline();
          }
        }
      }
    };
  }
}

module.exports = ChatWebSocket;
