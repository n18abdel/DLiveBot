const { createMessageOptions } = require("../../helpers/message");
const { getDisplayname } = require("../../helpers/request");

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { wasLive } = botState;

  if (!wasLive[guildId] || Object.keys(wasLive[guildId]).length === 0) {
    const locales = {
      fr: "Aucune alerte paramétrée",
      "en-US": "No setup alerts",
    };
    interaction
      .reply(
        createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
      )
      .catch((error) => console.log(error));
  } else {
    Promise.all(
      Object.keys(wasLive[guildId]).map((username) => getDisplayname(username))
    )
      .then((displaynames) => {
        const locales = {
          fr: `Alerte paramétrée pour le(s) streamer(s) :\n${displaynames.join(
            "\n"
          )}`,
          "en-US": `Alert set for streamer(s):\n${displaynames.join("\n")}`,
        };
        interaction.reply(
          createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
        );
      })
      .catch((error) => console.log(error));
  }
};

module.exports = func;
