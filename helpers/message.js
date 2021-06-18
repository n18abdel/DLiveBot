const Discord = require("discord.js");
const moment = require("moment-timezone");

const { updateDatabase } = require("./db");

// ================= ALERT MESSAGE HELPERS ===================
/**
 * Return only the properties title and permlink
 * from the input stream object
 *
 * @param {object} stream
 * @return {object}
 */
const selectTitlePermlink = ({ title, permlink }) => ({ title, permlink });

/**
 * Process input message, and retrieve custom emojis,
 * and replace displayname parameter with value
 *
 * @param {string} message
 * @param {string} guildId
 * @param {string} displayname
 * @param {object} botState
 * @return {string}
 */
const processMessage = (message, guildId, displayname, { client }) => {
  let processedMessage = message;
  processedMessage = processedMessage.replace(/<displayname>/g, displayname);
  const emojis = Array.from(message.matchAll(/:(.+?):/g));

  const retrievedEmojis = {};
  emojis.forEach((emoji) => {
    const emojiName = emoji[1];
    if (!retrievedEmojis[emojiName]) {
      const retrievedEmoji = client.guilds.cache
        .get(guildId)
        .emojis.cache.find((guildEmoji) => guildEmoji.name === emojiName);

      if (retrievedEmoji) {
        retrievedEmojis[emojiName] = retrievedEmoji;
      }
    }
  });

  Object.keys(retrievedEmojis).forEach((emoji) => {
    const toReplace = `:${emoji}:`;
    const regex = new RegExp(toReplace, "g");
    processedMessage = processedMessage.replace(regex, retrievedEmojis[emoji]);
  });
  return processedMessage;
};
/**
 * Message options for the alert sent on discord
 *
 * @param {object} params
 * @param {object} botState
 * @return {object}
 */
const getAlertMessageOptions = (
  { displayname, stream, online, chestValue, permlink, guildId, offlineImage },
  botState
) => {
  const { settings } = botState;
  const msgEmbed = new Discord.MessageEmbed()
    .setColor(settings.color)
    .setFooter(processMessage(settings.footer, guildId, displayname, botState));

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
      .setTitle(
        processMessage(settings.titleOnline, guildId, displayname, botState)
      )
      .addField("Titre", stream.title)
      .addField("Catégorie", stream.category.title)
      .setThumbnail(stream.category.imgUrl)
      .addField("Spectateurs", String(viewers), true)
      .setImage(stream.thumbnailUrl)
      .addField(
        "En live depuis",
        hours > 0
          ? `${hours}h${minutes > 0 ? String(minutes).padStart(2, "0") : ""}`
          : `${minutes}min`,
        true
      )
      .addField("Citrons reçus", `${streamReward} :lemon:`, true)
      .setURL(
        `https://dlive.tv/${displayname}?ref=${settings.referralUsername}`
      );
    if (chestValue) {
      const { chestNames } = settings;
      const ind = Math.floor(Math.random() * chestNames.length);
      msgEmbed.addField(chestNames[ind], `${chestValue} :lemon:`, true);
    }
  } else {
    msgEmbed
      .setTitle(
        processMessage(settings.titleOffline, guildId, displayname, botState)
      )
      .setDescription(
        processMessage(settings.offlineMessage, guildId, displayname, botState)
      )
      .setImage(offlineImage)
      .setURL(
        `https://dlive.tv/p/${permlink}?ref=${settings.referralUsername}`
      );
  }
  return msgEmbed;
};
/**
 * Send alert message to the given channel
 *
 * @param {string} displayname
 * @param {string} username
 * @param {string} stream
 * @param {string} guildId
 * @param {string} channelId
 * @param {string} channelName
 * @param {string} guildName
 * @param {object} botState
 */
const sendAlertMessage = (
  displayname,
  username,
  stream,
  guildId,
  channelId,
  channelName,
  guildName,
  botState
) => {
  const {
    client,
    settings,
    wasLive,
    alertHistory,
    lastStreams,
    alertChannels,
  } = botState;
  return client.channels.cache
    .get(channelId)
    .send({
      content: processMessage(
        settings.onlineMessage,
        guildId,
        displayname,
        botState
      ),
      embeds: [
        getAlertMessageOptions(
          {
            displayname,
            stream,
            online: true,
            guildId,
          },
          botState
        ),
      ],
    })
    .then(async (message) => {
      console.log(
        "[Discord]",
        `Sent announce msg to #${channelName} on ${guildName} for ${displayname}`
      );

      wasLive[guildId][username] = true;
      alertHistory[guildId][username] = message.id;
      lastStreams[guildId][username] = selectTitlePermlink(stream);
      await updateDatabase(
        wasLive,
        alertChannels,
        alertHistory,
        lastStreams,
        settings
      );
    })
    .catch((error) => console.log(error));
};

/**
 * Edit existing alert message with updates
 *
 * @param {object} params
 * @param {object} botState
 */
const editAlertMessage = (
  {
    displayname,
    username,
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
  },
  botState
) => {
  const {
    client,
    settings,
    wasLive,
    alertHistory,
    lastStreams,
    alertChannels,
  } = botState;
  return client.channels.cache
    .get(channelId)
    .messages.fetch(existingMsgId)
    .then((existingMsg) => {
      existingMsg.edit({
        content: processMessage(
          settings.onlineMessage,
          guildId,
          displayname,
          botState
        ),
        embeds: [
          getAlertMessageOptions(
            {
              displayname,
              stream,
              online,
              chestValue,
              permlink,
              guildId,
              offlineImage,
            },
            botState
          ),
        ],
      });
    })
    .then(async () => {
      console.log(
        "[Discord]",
        `Edited announce msg to #${channelName} on ${guildName} for ${displayname}`
      );
      if (permlink) {
        // when the streamer goes offline
        wasLive[guildId][username] = false;
        lastStreams[guildId][username].finishedAt = finishedAt;
        await updateDatabase(
          wasLive,
          alertChannels,
          alertHistory,
          lastStreams,
          settings
        );
      } else if (stream.title !== lastStreams[guildId][username]) {
        // the stream is still up
        lastStreams[guildId][username].title = stream.title;
        await updateDatabase(
          wasLive,
          alertChannels,
          alertHistory,
          lastStreams,
          settings
        );
      }
    })
    .catch((error) => console.log(error));
};

const createMessageOptions = (input, { embed = false } = {}) => {
  if (embed) {
    return { embeds: [input], ephemeral: true };
  }
  return { content: input, ephemeral: true };
};

module.exports = { sendAlertMessage, editAlertMessage, createMessageOptions };
