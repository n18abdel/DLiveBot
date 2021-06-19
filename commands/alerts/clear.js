const { closeWebsockets } = require("../../helpers/request");
const { updateDatabase } = require("../../helpers/db");
const { createMessageOptions } = require("../../helpers/message");

const func = async ({ interaction, guildId, botState }) => {
  const {
    settings,
    wasLive,
    alertHistory,
    lastStreams,
    alertChannels,
    websockets,
  } = botState;

  await closeWebsockets(websockets, guildId);
  delete wasLive[guildId];
  delete alertChannels[guildId];
  delete alertHistory[guildId];
  delete lastStreams[guildId];
  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  interaction
    .reply(createMessageOptions("Toutes les alertes ont été retirées"))
    .catch((error) => console.log(error));
};

module.exports = func;
