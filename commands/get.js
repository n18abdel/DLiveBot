const { createMessageOptions } = require("../helpers/message");
const { getDisplayname } = require("../helpers/request");

const commandData = {
  name: "get",
  description: "Voir les alertes existantes",
  defaultPermission: false,
};

const func = async ({ interaction, guildId, botState }) => {
  const { wasLive } = botState;

  if (!wasLive[guildId] || Object.keys(wasLive[guildId]).length === 0) {
    interaction
      .reply(createMessageOptions("Aucune alerte paramétrée"))
      .catch((error) => console.log(error));
  } else {
    Promise.all(
      Object.keys(wasLive[guildId]).map((username) => getDisplayname(username))
    )
      .then((displaynames) => {
        interaction.reply(
          createMessageOptions(
            `Alerte paramétrée pour le(s) streamer(s):\n${displaynames.join(
              "\n"
            )}`
          )
        );
      })
      .catch((error) => console.log(error));
  }
};

const get = {
  commandData,
  func,
};

module.exports = get;
