const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const {
  createMessageOptions,
  processSetMessage,
} = require("../../../helpers/message");

const func = async ({ interaction, guildId, args, botState }) => {
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  const { titleonline } = args;

  if (!settings[guildId]) settings[guildId] = settingsDefault;
  settings[guildId].titleOnline = processSetMessage(titleonline);

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  const answer = `Le titre de l'alerte pendant le live est maintenant:\n${settings[guildId].titleOnline}`;

  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
