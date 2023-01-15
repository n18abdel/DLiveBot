const _ = require("lodash");
const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  const color = interaction.options.getString("color");

  const isHexColor = (hex) =>
    typeof hex === "string" &&
    hex.replace("#", "").length === 6 &&
    !Number.isNaN(Number(`0x${hex.replace("#", "")}`));

  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);

  let locales;
  if (isHexColor(color)) {
    settings[guildId].color = color;
    locales = {
      fr: `La couleur pour les messages du bot est maintenant :\n${settings[guildId].color}`,
      "en-US": `Color for bot messages is now:\n${settings[guildId].color}`,
    };
  } else {
    locales = {
      fr: `${color} n'est pas un hex string.\nVérifiez votre saisie (exemple: #ffd300)`,
      "en-US": `${color} is not a hew string.\nPlease check your input (example: #ffd300)`,
    };
  }

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  interaction
    .reply(
      createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
    )
    .catch((error) => console.log(error));
};

module.exports = func;
