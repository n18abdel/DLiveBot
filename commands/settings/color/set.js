const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, guildId, args, botState }) => {
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  const { color } = args;

  const isHexColor = (hex) =>
    typeof hex === "string" &&
    hex.replace("#", "").length === 6 &&
    !Number.isNaN(Number(`0x${hex.replace("#", "")}`));

  if (!settings[guildId]) settings[guildId] = settingsDefault;

  let answer;
  if (isHexColor(color)) {
    settings[guildId].color = color;
    answer = `La couleur pour les messages du bot est maintenant:\n${settings[guildId].color}`;
  } else {
    answer = `${color} n'est pas un hex string.\nVérifiez votre saisie (exemple: #ffd300)`;
  }

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
