const _ = require("lodash");
const settingsDefault = require("../../../settings");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);

  const locales = {
    fr: `Les noms possibles pour le coffre sont :\n${settings[
      guildId
    ].chestNames.join("\n")}`,
    "en-US": `Available chest names are:\n${settings[guildId].chestNames.join(
      "\n"
    )}`,
  };

  interaction
    .reply(
      createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
    )
    .catch((error) => console.log(error));
};

module.exports = func;
