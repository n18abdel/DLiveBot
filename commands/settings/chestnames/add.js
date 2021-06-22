const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const { createMessageOptions } = require("../../../helpers/message");

const func = async ({ interaction, guildId, args, botState }) => {
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;
  if (!settings[guildId]) settings[guildId] = settingsDefault;

  const { chestname } = args;

  settings[guildId].chestNames.push(chestname);

  await updateDatabase(
    wasLive,
    alertChannels,
    alertHistory,
    lastStreams,
    settings
  );

  const answer = `Le nom de coffre ${chestname} a été ajouté`;

  interaction
    .reply(createMessageOptions(answer))
    .catch((error) => console.log(error));
};

module.exports = func;
