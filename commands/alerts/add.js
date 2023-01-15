const _ = require("lodash");
const settingsDefault = require("../../settings");
const { updateDatabase } = require("../../helpers/db");
const { createMessageOptions } = require("../../helpers/message");
const { addWebSockets } = require("../../helpers/websocket");
const { getUsername } = require("../../helpers/request");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { channelId } = interaction;
  const {
    settings,
    wasLive,
    alertHistory,
    lastStreams,
    alertChannels,
    websockets,
  } = botState;

  const displayname = interaction.options.getString("displayname");

  if (!(guildId in wasLive)) {
    websockets[guildId] = [];
    wasLive[guildId] = {};
    alertHistory[guildId] = {};
    lastStreams[guildId] = {};
    alertChannels[guildId] = channelId;
    settings[guildId] = _.cloneDeep(settingsDefault);
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

          const locales = {
            fr: `Alerte paramétrée pour ${displayname}`,
            "en-US": `Alert set for ${displayname}`,
          };
          interaction.reply(
            createMessageOptions(
              locales[interaction.locale] ?? locales["en-US"]
            )
          );
        }
      } else {
        const locales = {
          fr: `Aucun streamer avec le nom ${displayname} a été trouvé\nVérifiez votre saisie`,
          "en-US": `No streamer found with name ${displayname}\nPlease check your input`,
        };
        interaction.reply(
          createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
        );
      }
    })
    .catch((error) => console.log(error));
};

module.exports = func;
