const { updateDatabase } = require("../../helpers/db");
const { createMessageOptions } = require("../../helpers/message");
const {
  createChatWebSocket,
  createChestWebSocket,
  getUsername,
} = require("../../helpers/request");

const func = async ({ interaction, guildId, channelId, args, botState }) => {
  const {
    settings,
    wasLive,
    alertHistory,
    lastStreams,
    alertChannels,
    websockets,
  } = botState;

  const { displayname } = args;

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
      settings
    );
  }

  getUsername(displayname)
    .then(async (username) => {
      if (username) {
        if (username in wasLive[guildId]) {
          interaction.reply(
            createMessageOptions(`Une alerte existe déjà pour ${displayname}`)
          );
        } else {
          wasLive[guildId][username] = false;
          await updateDatabase(
            wasLive,
            alertChannels,
            alertHistory,
            lastStreams,
            settings
          );

          const ws = createChatWebSocket(
            username,
            displayname,
            guildId,
            channelId,
            botState
          );
          const cs = createChestWebSocket(
            username,
            displayname,
            guildId,
            channelId,
            botState
          );
          websockets[guildId].push(ws);
          websockets[guildId].push(cs);

          interaction.reply(
            createMessageOptions(`Alerte paramétrée pour ${displayname}`)
          );
        }
      } else {
        interaction.reply(
          createMessageOptions(
            `Aucun streamer avec le nom ${displayname} a été trouvé\nVérifiez votre saisie`
          )
        );
      }
    })
    .catch((error) => console.log(error));
};

module.exports = func;
