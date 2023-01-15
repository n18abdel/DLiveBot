const _ = require("lodash");
const settingsDefault = require("../../../settings");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);

  const locales = {
    fr: `Le message de début de live est :\n${settings[guildId].onlineMessage}`,
    "en-US": `The online message is:\n${settings[guildId].onlineMessage}`,
  };

  interaction
    .reply(
      createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
    )
    .catch((error) => console.log(error));
};

module.exports = func;
