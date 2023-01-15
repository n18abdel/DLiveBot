const { closeWebSockets } = require("../../helpers/websocket");
const { updateDatabase } = require("../../helpers/db");
const { createMessageOptions } = require("../../helpers/message");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const {
    settings,
    wasLive,
    alertHistory,
    lastStreams,
    alertChannels,
    websockets,
  } = botState;

  await closeWebSockets(websockets, guildId);
  delete wasLive[guildId];
  delete alertChannels[guildId];
  delete alertHistory[guildId];
  delete lastStreams[guildId];
  delete settings[guildId];
  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );
  const locales = {
    fr: "Toutes les alertes ont été retirées",
    "en-US": "Every alert has been removed",
  };
  interaction
    .reply(
      createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
    )
    .catch((error) => console.log(error));
};

module.exports = func;
