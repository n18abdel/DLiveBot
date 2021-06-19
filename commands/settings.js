const glob = require("glob");
const { getOptions } = require("../helpers/command");

const funcs = {};

glob.sync("./commands/settings/**/*.js").forEach((commandFile) => {
  const commandName = commandFile.match(/.*\/(.*)\.js/)[1];
  const commandGroup = commandFile.match(/.*\/(.*)\/.*\.js/)[1];
  if (!funcs[commandGroup]) funcs[commandGroup] = {};
  funcs[commandGroup][
    commandName
  ] = require(`./settings/${commandGroup}/${commandName}`);
});

const commandData = {
  name: "settings",
  description: "Voir ou modifier les réglages",
  options: [
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
