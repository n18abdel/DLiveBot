const _ = require("lodash");
const settingsDefault = require("../../../settings");
const { createMessageOptions } = require("../../../helpers/message");
const { delayExplainer } = require("../../../constants");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);

  let locales;
  if (settings[guildId].sameTitleDelay <= 0) {
    locales = {
      fr: `Il n'y a pas de délai paramétré\n\n${delayExplainer.fr}`,
      "en-US": `There is not any delay configured\n\n${delayExplainer["en-US"]}`,
    };
  } else {
    locales = {
      fr: `Le délai paramétré est de ${settings[guildId].sameTitleDelay} minutes\n\n${delayExplainer.fr}`,
      "en-US": `The configured delay is ${settings[guildId].sameTitleDelay} minutes\n\n${delayExplainer["en-US"]}`,
    };
  }
  interaction
    .reply(
      createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
    )
    .catch((error) => console.log(error));
};

module.exports = func;
