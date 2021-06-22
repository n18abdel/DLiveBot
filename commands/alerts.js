const { loadCommands, getOptions } = require("../helpers/command");

const funcs = {};

Object.entries(loadCommands({ folder: "alerts" })).forEach(
  ([command, path]) => {
    funcs[command] = require(path);
  }
);

const commandData = {
  name: "alerts",
  description: "Gérer les alertes",
  options: [
    {
      name: "add",
      type: "SUB_COMMAND",
      description: "Ajouter une alerte",
      options: [
        {
          name: "displayname",
          type: "STRING",
          description: "Le nom du streamer (tel qu'on le voit sur DLive)",
          required: true,
        },
      ],
      defaultPermission: false,
    },
    {
      name: "clear",
      type: "SUB_COMMAND",
      description: "Retirer toutes les alertes",
      defaultPermission: false,
    },
    {
      name: "get",
      type: "SUB_COMMAND",
      description: "Voir les alertes existantes",
      defaultPermission: false,
    },
  ],
  defaultPermission: false,
};

const func = async ({ interaction, guildId, channelId, args, botState }) => {
  const { name: commandName } = args;

  funcs[commandName]({
    interaction,
    guildId,
    channelId,
    args: getOptions(args),
    botState,
  });
};

module.exports = {
  commandData,
  func,
};
