const _ = require("lodash");
const settingsDefault = require("../../../settings");
const { updateDatabase } = require("../../../helpers/db");
const { createMessageOptions } = require("../../../helpers/message");
const { getUsername } = require("../../../helpers/request");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { settings, wasLive, alertHistory, lastStreams, alertChannels } =
    botState;

  const displayname = interaction.options.getString("displayname");

  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);

  getUsername(displayname).then(async (username) => {
    let locales;
    if (username) {
      settings[guildId].referralUsername = username;
      await updateDatabase(
        wasLive,
        alertChannels,
        alertHistory,
        lastStreams,
        settings
      );
      locales = {
        fr: `L'utilisateur pour le lien referral est maintenant :\n${displayname} (username: ${settings[guildId].referralUsername})`,
        "en-US": `The referral user is now:\n${displayname} (username: ${settings[guildId].referralUsername})`,
      };
    } else {
      locales = {
        fr: `L'utilisateur ${displayname} n'a pas été trouvé\nVérifiez votre saisie`,
        "en-US": `The user ${displayname} has not been found\nPlease check your input`,
      };
    }
    interaction
      .reply(
        createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
      )
      .catch((error) => console.log(error));
  });
};

module.exports = func;
