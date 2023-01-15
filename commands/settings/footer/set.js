const _ = require("lodash");
const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const {
  createMessageOptions,
  processSetMessage,
} = require("../../../helpers/message");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  const footer = interaction.options.getString("footer");

  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);
  settings[guildId].footer = processSetMessage(footer);

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  const locales = {
    fr: `Le message est bas de l'alerte est maintenant :\n${settings[guildId].footer}`,
    "en-US": `The footer is now:\n${settings[guildId].footer}`,
  };

  interaction
    .reply(
      createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
    )
    .catch((error) => console.log(error));
};

module.exports = func;
