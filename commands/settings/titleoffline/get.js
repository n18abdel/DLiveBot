const _ = require("lodash");
const settingsDefault = require("../../../settings");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);

  const locales = {
    fr: `Le titre de l'alerte en fin de live est :\n${settings[guildId].titleOffline}`,
    "en-US": `The alert offline title is:\n${settings[guildId].titleOffline}`,
  };

  interaction
    .reply(
      createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
    )
    .catch((error) => console.log(error));
};

module.exports = func;
