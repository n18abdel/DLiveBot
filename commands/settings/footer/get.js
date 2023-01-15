const _ = require("lodash");
const settingsDefault = require("../../../settings");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);

  const locales = {
    fr: `Le message en bas de l'alerte est :\n${settings[guildId].footer}`,
    "en-US": `The footer is:\n${settings[guildId].footer}`,
  };

  interaction
    .reply(
      createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
    )
    .catch((error) => console.log(error));
};

module.exports = func;
