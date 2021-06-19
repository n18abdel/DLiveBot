const { updateDatabase } = require("../../../helpers/db");
const { createMessageOptions } = require("../../../helpers/message");
const { delayExplainer } = require("../../../constants");

const func = async ({ interaction, args, botState }) => {
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  const { delay } = args;

  settings.sameTitleDelay = Number(delay);

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  let answer;
  if (settings.sameTitleDelay <= 0) {
    answer = `Le délai est maintenant désactivé\n\n${delayExplainer}`;
  } else {
    answer = `Le délai paramétré est maintenant de ${settings.sameTitleDelay} minutes\n\n${delayExplainer}`;
  }

  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
