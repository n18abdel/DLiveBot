const { createMessageOptions } = require("../helpers/message");
const { delayExplainer } = require("../constants");

const commandData = {
  name: "get_delay",
  description: "Voir le délai paramétré",
  defaultPermission: false,
};

const func = async ({ interaction, botState }) => {
  const { settings } = botState;

  let answer;
  if (settings.sameTitleDelay <= 0) {
    answer = `Il n'y a pas de délai paramétré\n\n${delayExplainer}`;
  } else {
    answer = `Le délai paramétré est de ${settings.sameTitleDelay} minutes\n\n${delayExplainer}`;
  }
  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

const getDelay = {
  commandData,
  func,
};

module.exports = getDelay;
