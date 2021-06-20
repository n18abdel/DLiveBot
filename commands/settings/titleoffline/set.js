const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, guildId, args, botState }) => {
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  const { titleoffline } = args;

  if (!settings[guildId]) settings[guildId] = settingsDefault;
  settings[guildId].titleOffline = titleoffline;

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  const answer = `Le titre de l'alerte en fin de live est maintenant:\n${settings[guildId].titleOffline}`;

  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
