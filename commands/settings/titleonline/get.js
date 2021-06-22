const settingsDefault = require("../../../settings");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, guildId, botState }) => {
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = settingsDefault;

  const answer = `Le titre de l'alerte pendant le live est:\n${settings[guildId].titleOnline}`;

  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
