const settingsDefault = require("../../../settings");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, guildId, botState }) => {
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = settingsDefault;

  const answer = `Le message en bas de l'alerte est:\n${settings[guildId].footer}`;

  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
