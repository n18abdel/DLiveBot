const { loadCommands, getOptions } = require("../helpers/command");

const funcs = {};

Object.entries(loadCommands({ folder: "settings", subGroup: true })).forEach(
  ([commandGroup, commands]) => {
    if (!funcs[commandGroup]) funcs[commandGroup] = {};
    Object.entries(commands).forEach(([command, path]) => {
      funcs[commandGroup][command] = require(path);
    });
  }
);

const commandData = {
  name: "settings",
  description: "Voir ou modifier les réglages",
  options: [
    {
      name: "chestnames",
      type: "SUB_COMMAND_GROUP",
      description: "Les noms possibles pour le coffre",
      options: [
        {
          name: "get",
          type: "SUB_COMMAND",
          description: "Voir les noms du coffre",
          defaultPermission: false,
        },
        {
          name: "add",
          type: "SUB_COMMAND",
          description: "Ajouter un nom pour le coffre",
          options: [
            {
              name: "chestname",
              type: "STRING",
              description: "Un nom pour le coffre",
              required: true,
            },
          ],
          defaultPermission: false,
        },
        {
          name: "reset",
          type: "SUB_COMMAND",
          description: "Mettre les noms de coffre par défaut",
          defaultPermission: false,
        },
      ],
    },
    {
      name: "color",
      type: "SUB_COMMAND_GROUP",
      description: "La couleur sur les messages du bot",
      options: [
        {
          name: "get",
          type: "SUB_COMMAND",
          description: "Voir la couleur paramétrée",
          defaultPermission: false,
        },
        {
          name: "set",
          type: "SUB_COMMAND",
          description: "Modifier la couleur",
          options: [
            {
              name: "color",
              type: "STRING",
              description: "Un color hex",
              required: true,
            },
          ],
          defaultPermission: false,
        },
      ],
    },
    {
      name: "delay",
      type: "SUB_COMMAND_GROUP",
      description:
        "Le délai max entre 2 streams de même titre, avant d'envoyer une nouvelle alerte",
      options: [
        {
          name: "get",
          type: "SUB_COMMAND",
          description: "Voir le délai paramétré",
          defaultPermission: false,
        },
        {
          name: "set",
          type: "SUB_COMMAND",
          description: "Modifier le délai (mettre 0 pour désactiver le délai)",
          options: [
            {
              name: "delay",
              type: "STRING",
              description: "Délai en minutes",
              required: true,
            },
          ],
          defaultPermission: false,
        },
      ],
    },

    {
      name: "footer",
      type: "SUB_COMMAND_GROUP",
      description: "Le message en bas de l'alerte",
      options: [
        {
          name: "get",
          type: "SUB_COMMAND",
          description: "Voir le message paramétré en bas de l'alerte",
          defaultPermission: false,
        },
        {
          name: "set",
          type: "SUB_COMMAND",
          description: "Modifier le message en bas de l'alerte",
          options: [
            {
              name: "footer",
              type: "STRING",
              description: "Le message en bas de l'alerte",
              required: true,
            },
          ],
          defaultPermission: false,
        },
      ],
    },
    {
      name: "offlinemessage",
      type: "SUB_COMMAND_GROUP",
      description: "Le message de fin de live",
      options: [
        {
          name: "get",
          type: "SUB_COMMAND",
          description: "Voir le message de fin de live",
          defaultPermission: false,
        },
        {
          name: "set",
          type: "SUB_COMMAND",
          description: "Modifier le message de fin de live",
          options: [
            {
              name: "offlinemessage",
              type: "STRING",
              description: "Le message de fin de live",
              required: true,
            },
          ],
          defaultPermission: false,
        },
      ],
    },
    {
      name: "onlinemessage",
      type: "SUB_COMMAND_GROUP",
      description: "Le message de début de live",
      options: [
        {
          name: "get",
          type: "SUB_COMMAND",
          description: "Voir le message de début de live",
          defaultPermission: false,
        },
        {
          name: "set",
          type: "SUB_COMMAND",
          description: "Modifier le message de début de live",
          options: [
            {
              name: "onlinemessage",
              type: "STRING",
              description: "Le message de début de live",
              required: true,
            },
          ],
          defaultPermission: false,
        },
      ],
    },
    {
      name: "referralusername",
      type: "SUB_COMMAND_GROUP",
      description: "L'username pour le lien referral",
      options: [
        {
          name: "get",
          type: "SUB_COMMAND",
          description: "Voir le referral paramétré",
          defaultPermission: false,
        },
        {
          name: "set",
          type: "SUB_COMMAND",
          description: "Modifier le referral",
          options: [
            {
              name: "referralusername",
              type: "STRING",
              description: "L'username pour le lien referral",
              required: true,
            },
          ],
          defaultPermission: false,
        },
      ],
    },
    {
      name: "titleoffline",
      type: "SUB_COMMAND_GROUP",
      description: "Le titre de l'alerte en fin de live",
      options: [
        {
          name: "get",
          type: "SUB_COMMAND",
          description: "Voir le titre de l'alerte en fin de live",
          defaultPermission: false,
        },
        {
          name: "set",
          type: "SUB_COMMAND",
          description: "Modifier le titre de l'alerte en fin de live",
          options: [
            {
              name: "titleoffline",
              type: "STRING",
              description: "Le titre de l'alerte en fin de live",
              required: true,
            },
          ],
          defaultPermission: false,
        },
      ],
    },
    {
      name: "titleonline",
      type: "SUB_COMMAND_GROUP",
      description: "Le titre de l'alerte pendant le live",
      options: [
        {
          name: "get",
          type: "SUB_COMMAND",
          description: "Voir le titre de l'alerte pendant le live",
          defaultPermission: false,
        },
        {
          name: "set",
          type: "SUB_COMMAND",
          description: "Modifier le titre de l'alerte pendant le live",
          options: [
            {
              name: "titleonline",
              type: "STRING",
              description: "Le titre de l'alerte pendant le live",
              required: true,
            },
          ],
          defaultPermission: false,
        },
      ],
    },
  ],
  defaultPermission: false,
};

const func = async ({ interaction, guildId, channelId, args, botState }) => {
  const { name: commandGroup } = args;
  const { name: commandName } = getOptions(args);

  funcs[commandGroup][commandName]({
    interaction,
    guildId,
    channelId,
    args: getOptions(getOptions(args)),
    botState,
  });
};

module.exports = {
  commandData,
  func,
};
