const _ = require("lodash");
const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);
  settings[guildId].chestNames = _.cloneDeep(settingsDefault.chestNames);

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  const locales = {
    fr: `Les noms possibles pour le coffre sont maintenant :\n${settings[
      guildId
    ].chestNames.join("\n")}`,
    "en-US": `Available chest names are now:\n${settings[
      guildId
    ].chestNames.join("\n")}`,
  };

  interaction
    .reply(
      createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
    )
    .catch((error) => console.log(error));
};

module.exports = func;
