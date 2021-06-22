const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const { createMessageOptions } = require("../../../helpers/message");
const { getUsername } = require("../../../helpers/request");

const func = async ({ interaction, guildId, args, botState }) => {
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  const { displayname } = args;

  if (!settings[guildId]) settings[guildId] = settingsDefault;

  getUsername(displayname).then(async (username) => {
    let answer;
    if (username) {
      settings[guildId].referralUsername = username;
      await updateDatabase(
        wasLive,
        alertChannels,
        alertHistory,
        lastStreams,
        settings
      );
      answer = `L'utilisateur pour le lien referral est maintenant:\n${displayname} (username: ${settings[guildId].referralUsername})`;
    } else {
      answer = `L'utilisateur ${displayname} n'a pas été trouvé\nVérifiez votre saisie`;
    }
    interaction
      .reply(createMessageOptions(answer))
      .catch((error) => console.log(error));
  });
};

module.exports = func;
