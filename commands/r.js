const https = require("https");
const moment = require("moment-timezone");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { createMessageOptions } = require("../helpers/message");
const { getUsername } = require("../helpers/request");

const commandData = new SlashCommandBuilder()
  .setName("r")
  .setDescription("r")
  .setDefaultMemberPermissions("0")
  .addStringOption((option) =>
    option.setName("s").setDescription("s").setRequired(true)
  )
  .toJSON();

const range = (size, startAt) =>
  [...Array(size).keys()].map((i) => i + startAt);

const computeUrl = (username, timestamp, { end = true } = {}) => {
  if (end) {
    return `https://playback.prd.dlivecdn.com/live/${username}/${timestamp}/master/stitched-playlist.m3u8`;
  }
  return `https://playback.prd.dlivecdn.com/live/${username}/${timestamp}/vod.m3u8`;
};

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { lastStreams } = botState;

  const s = interaction.options.getString("s");

  getUsername(s).then((username) => {
    const beginningTimestamp = moment(
      Number(lastStreams[guildId][username].createdAt)
    ).unix();
    const endingTimestamp = moment(
      Number(lastStreams[guildId][username].finishedAt)
    ).unix();

    Promise.any(
      range(60, -15).map(
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
          range(60, -15).map(
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
