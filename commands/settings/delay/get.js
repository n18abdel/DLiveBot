const settingsDefault = require("../../../settings");
const { createMessageOptions } = require("../../../helpers/message");
const { delayExplainer } = require("../../../constants");

const func = async ({ interaction, guildId, botState }) => {
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = settingsDefault;

  let answer;
  if (settings[guildId].sameTitleDelay <= 0) {
    answer = `Il n'y a pas de délai paramétré\n\n${delayExplainer}`;
  } else {
    answer = `Le délai paramétré est de ${settings[guildId].sameTitleDelay} minutes\n\n${delayExplainer}`;
  }
  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
