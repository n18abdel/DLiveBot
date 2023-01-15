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

  const onlinemessage = interaction.options.getString("onlinemessage");

  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);
  settings[guildId].onlineMessage = processSetMessage(onlinemessage);

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  const locales = {
    fr: `Le message de début de live est maintenant :\n${settings[guildId].onlineMessage}`,
    "en-US": `The online message is now:\n${settings[guildId].onlineMessage}`,
  };

  interaction
    .reply(
      createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
    )
    .catch((error) => console.log(error));
};

module.exports = func;
