const settingsDefault = require("../../../settings");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, guildId, botState }) => {
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = settingsDefault;

  const answer = `L'username pour le lien referral est:\n${settings[guildId].referralUsername}`;

  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
