const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, guildId, args, botState }) => {
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  const { footer } = args;

  if (!settings[guildId]) settings[guildId] = settingsDefault;
  settings[guildId].footer = footer;

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  const answer = `Le message est bas e l'alerte est maintenant:\n${settings[guildId].footer}`;

  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
