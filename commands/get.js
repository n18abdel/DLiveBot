const { createMessageOptions } = require("../helpers/message");

const commandData = {
  name: "get",
  description: "Voir les alertes existantes",
  defaultPermission: false,
};

const func = async ({ interaction, guildId, botState }) => {
  const { wasLive } = botState;

  if (wasLive[guildId] == null || Object.keys(wasLive[guildId]).length == 0) {
    interaction
      .reply(createMessageOptions("Aucune alerte paramétrée"))
      .catch((error) => console.log(error));
  } else {
    interaction
      .reply(
        createMessageOptions(
          `Alerte paramétrée pour le(s) streamer(s):\n${Object.keys(
            wasLive[guildId]
          ).join("\n")}`
        )
      )
      .catch((error) => console.log(error));
  }
};

const get = {
  commandData,
  func,
};

module.exports = get;
