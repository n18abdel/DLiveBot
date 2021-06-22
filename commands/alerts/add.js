const settingsDefault = require("../../settings");
const { updateDatabase } = require("../../helpers/db");
const { createMessageOptions } = require("../../helpers/message");
const { addWebSockets } = require("../../helpers/websocket");
const { getUsername } = require("../../helpers/request");

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
    settings[guildId] = settingsDefault;
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

          addWebSockets(username, displayname, guildId, channelId, botState);

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
