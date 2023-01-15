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

  const titleonline = interaction.options.getString("titleonline");

  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);
  settings[guildId].titleOnline = processSetMessage(titleonline);

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  const locales = {
    fr: `Le titre de l'alerte pendant le live est maintenant :\n${settings[guildId].titleOnline}`,
    "en-US": `The online title is now:\n${settings[guildId].titleOnline}`,
  };

  interaction
    .reply(
      createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
    )
    .catch((error) => console.log(error));
};

module.exports = func;
