const _ = require("lodash");
const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const { createMessageOptions } = require("../../../helpers/message");
const { delayExplainer } = require("../../../constants");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  const delay = interaction.options.getString("delay");

  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);
  settings[guildId].sameTitleDelay = Number(delay);

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  let locales;
  if (settings[guildId].sameTitleDelay <= 0) {
    locales = {
      fr: `Le délai est maintenant désactivé\n\n${delayExplainer.fr}`,
      "en-US": `The delay is now disabled\n\n${delayExplainer["en-US"]}`,
    };
  } else {
    locales = {
      fr: `Le délai paramétré est maintenant de ${settings[guildId].sameTitleDelay} minutes\n\n${delayExplainer.fr}`,
      "en-US": `The configured delay is now ${settings[guildId].sameTitleDelay} minutes\n\n${delayExplainer["en-US"]}`,
    };
  }

  interaction
    .reply(
      createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
    )
    .catch((error) => console.log(error));
};

module.exports = func;
