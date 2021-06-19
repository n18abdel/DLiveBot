const https = require("https");
const moment = require("moment-timezone");
const { createMessageOptions } = require("../helpers/message");
const { getUsername } = require("../helpers/request");

const commandData = {
  name: "r",
  description: "r",
  options: [
    {
      name: "s",
      type: "STRING",
      description: "s",
      required: true,
    },
  ],
  defaultPermission: false,
};

const range = (size, startAt) =>
  [...Array(size).keys()].map((i) => i + startAt);

const computeUrl = (username, timestamp, { end = true } = {}) => {
  if (end) {
    return `https://playback.prd.dlivecdn.com/live/${username}/${timestamp}/master/stitched-playlist.m3u8`;
  }
  return `https://playback.prd.dlivecdn.com/live/${username}/${timestamp}/vod.m3u8`;
};

const func = async ({ interaction, guildId, args, botState }) => {
  const { lastStreams } = botState;

  const { s } = args;

  getUsername(s).then((username) => {
    const beginningTimestamp = moment(
      Number(lastStreams[username][guildId].createdAt)
    ).unix();
    const endingTimestamp = moment(
      Number(lastStreams[username][guildId].finishedAt)
    ).unix();

    Promise.any(
      range(60, -15).forEach(
        (i) =>
          new Promise((resolve, reject) => {
            const url = computeUrl(username, endingTimestamp + i);
            https.get(url, (res) => {
              if (res.statusCode === 200) {
                resolve(url);
              }
              reject();
            });
          })
      )
    )
      .catch(() =>
        Promise.any(
          range(60, -15).forEach(
            (i) =>
              new Promise((resolve, reject) => {
                const url = computeUrl(username, beginningTimestamp + i, {
                  end: false,
                });
                https.get(url, (res) => {
                  if (res.statusCode === 200) {
                    resolve(url);
                  }
                  reject();
                });
              })
          )
        )
      )
      .then((url) => {
        interaction.reply(createMessageOptions(url));
      })
      .catch(() => interaction.reply(createMessageOptions("nothing there")));
  });
};

module.exports = {
  commandData,
  func,
};
