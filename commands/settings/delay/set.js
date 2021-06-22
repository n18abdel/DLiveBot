const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const { createMessageOptions } = require("../../../helpers/message");
const { delayExplainer } = require("../../../constants");

const func = async ({ interaction, guildId, args, botState }) => {
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  const { delay } = args;

  if (!settings[guildId]) settings[guildId] = settingsDefault;
  settings[guildId].sameTitleDelay = Number(delay);

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  let answer;
  if (settings[guildId].sameTitleDelay <= 0) {
    answer = `Le délai est maintenant désactivé\n\n${delayExplainer}`;
  } else {
    answer = `Le délai paramétré est maintenant de ${settings[guildId].sameTitleDelay} minutes\n\n${delayExplainer}`;
  }

  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
