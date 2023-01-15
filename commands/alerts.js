const { SlashCommandBuilder } = require("@discordjs/builders");
const { loadCommands } = require("../helpers/command");

const funcs = {};

Object.entries(loadCommands({ folder: "alerts" })).forEach(
  ([command, path]) => {
    funcs[command] = require(path);
  }
);

const commandData = new SlashCommandBuilder()
  .setName("alerts")
  .setNameLocalization("fr", "alertes")
  .setDescription("Manage alerts")
  .setDescriptionLocalization("fr", "Gérer les alertes")
  .setDefaultMemberPermissions("0")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("Add an alert")
      .setDescriptionLocalization("fr", "Ajouter une alerte")
      .addStringOption((option) =>
        option
          .setName("displayname")
          .setDescription("The streamer name (as seen on DLive)")
          .setDescriptionLocalization(
            "fr",
            "Le nom du streamer (tel qu'on le voit sur DLive)"
          )
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("clear")
      .setDescription("Remove all alerts")
      .setDescriptionLocalization("fr", "Retirer toutes les alertes")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("get")
      .setDescription("Look at existing alerts")
      .setDescriptionLocalization("fr", "Voir les alertes existantes")
  )
  .toJSON();

const func = async ({ interaction, botState }) => {
  const commandName = interaction.options.getSubcommand();

  funcs[commandName]({
    interaction,
    botState,
  });
};

module.exports = {
  commandData,
  func,
};
