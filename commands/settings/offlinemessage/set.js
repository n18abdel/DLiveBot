const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const {
  createMessageOptions,
  processSetMessage,
} = require("../../../helpers/message");

const func = async ({ interaction, guildId, args, botState }) => {
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  const { offlinemessage } = args;

  if (!settings[guildId]) settings[guildId] = settingsDefault;
  settings[guildId].offlineMessage = processSetMessage(offlinemessage);

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  const answer = `Le message de fin de live est maintenant:\n${settings[guildId].offlineMessage}`;

  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
