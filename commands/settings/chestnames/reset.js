const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, guildId, botState }) => {
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  if (!settings[guildId]) settings[guildId] = settingsDefault;
  settings[guildId].chestNames = settingsDefault.chestNames;

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  const answer = `Les noms possibles pour le coffre sont maintenant:\n${settings[
    guildId
  ].chestNames.join("\n")}`;

  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
