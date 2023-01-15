const _ = require("lodash");
const settingsDefault = require("../../../settings");
const { createMessageOptions } = require("../../../helpers/message");
const { getDisplayname } = require("../../../helpers/request");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);

  getDisplayname(settings[guildId].referralUsername).then((displayname) => {
    const locales = {
      fr: `L'utilisateur pour le lien referral est :\n${displayname} (username: ${settings[guildId].referralUsername})`,
      "en-US": `The referral user is:\n${displayname} (username: ${settings[guildId].referralUsername})`,
    };

    interaction
      .reply(
        createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
      )
      .catch((error) => console.log(error));
  });
};

module.exports = func;
