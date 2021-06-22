const settingsDefault = require("../../../settings");
const { createMessageOptions } = require("../../../helpers/message");
const { getDisplayname } = require("../../../helpers/request");

const func = async ({ interaction, guildId, botState }) => {
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = settingsDefault;

  getDisplayname(settings[guildId].referralUsername).then((displayname) => {
    const answer = `L'utilisateur pour le lien referral est:\n${displayname} (username: ${settings[guildId].referralUsername})`;

    interaction
      .reply(createMessageOptions(answer))
      .catch((error) => console.log(error));
  });
};

module.exports = func;
