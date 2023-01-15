const { SlashCommandBuilder } = require("@discordjs/builders");
const { loadCommands } = require("../helpers/command");

const funcs = {};

Object.entries(loadCommands({ folder: "settings", subGroup: true })).forEach(
  ([commandGroup, commands]) => {
    if (!funcs[commandGroup]) funcs[commandGroup] = {};
    Object.entries(commands).forEach(([command, path]) => {
      funcs[commandGroup][command] = require(path);
    });
  }
);

const commandData = new SlashCommandBuilder()
  .setName("settings")
  .setNameLocalization("fr", "réglages")
  .setDescription("Manage settings")
  .setDescriptionLocalization("fr", "Gérer les réglages")
  .setDefaultMemberPermissions("0")
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("chestnames")
      .setNameLocalization("fr", "noms_du_coffre")
      .setDescription("Available chest names")
      .setDescriptionLocalization("fr", "Les noms possibles pour le coffre")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("get")
          .setNameLocalization("fr", "voir")
          .setDescription("Get current chest names")
          .setDescriptionLocalization("fr", "Voir les noms du coffre")
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("add")
          .setNameLocalization("fr", "ajouter")
          .setDescription("Add a chest name")
          .setDescriptionLocalization("fr", "Ajouter un nom pour le coffre")
          .addStringOption((option) =>
            option
              .setName("chestname")
              .setDescription("A chest name")
              .setDescriptionLocalization("fr", "Un nom pour le coffre")
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("reset")
          .setNameLocalization("fr", "réinitialiser")
          .setDescription("Reset chest names back to default")
          .setDescriptionLocalization(
            "fr",
            "Mettre les noms de coffre par défaut"
          )
      )
  )
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("color")
      .setNameLocalization("fr", "couleur")
      .setDescription("Color on bot messages")
      .setDescriptionLocalization("fr", "La couleur sur les messages du bot")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("get")
          .setNameLocalization("fr", "voir")
          .setDescription("Get current color")
          .setDescriptionLocalization("fr", "Voir la couleur paramétrée")
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setNameLocalization("fr", "modifier")
          .setDescription("Set the color")
          .setDescriptionLocalization("fr", "Modifier la couleur")
          .addStringOption((option) =>
            option
              .setName("color")
              .setNameLocalization("fr", "couleur")

              .setDescription("color HEX")
              .setDescriptionLocalization("fr", "HEX de la couleur voulue")
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("delay")
      .setNameLocalization("fr", "délai")
      .setDescription(
        "The maximum delay between two same title streams, before triggering a new alert"
      )
      .setDescriptionLocalization(
        "fr",
        "Le délai max entre 2 streams de même titre, avant d'envoyer une nouvelle alerte"
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("get")
          .setNameLocalization("fr", "voir")
          .setDescription("Get current delay")
          .setDescriptionLocalization("fr", "Voir la délai paramétré")
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setNameLocalization("fr", "modifier")
          .setDescription("Set the delay (put 0 to disable the delay)")
          .setDescriptionLocalization(
            "fr",
            "Modifier le délai (mettre 0 pour désactiver le délai)"
          )
          .addStringOption((option) =>
            option
              .setName("delay")
              .setNameLocalization("fr", "délai")
              .setDescription("Delay in minutes")
              .setDescriptionLocalization("fr", "Délai en minutes")
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("footer")
      .setNameLocalization("fr", "pied_de_page")
      .setDescription("The footer of the alert")
      .setDescriptionLocalization("fr", "Le message en bas de l'alerte")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("get")
          .setNameLocalization("fr", "voir")
          .setDescription("Get current alert footer")
          .setDescriptionLocalization(
            "fr",
            "Voir le message paramétré en bas de l'alerte"
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setNameLocalization("fr", "modifier")
          .setDescription("Set the alert footer")
          .setDescriptionLocalization(
            "fr",
            "Modifier le message en bas de l'alerte"
          )
          .addStringOption((option) =>
            option
              .setName("footer")
              .setNameLocalization("fr", "pied_de_page")
              .setDescription("Alert footer")
              .setDescriptionLocalization("fr", "Le message en bas de l'alerte")
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("offlinemessage")
      .setNameLocalization("fr", "message_hors_ligne")
      .setDescription("End of stream message")
      .setDescriptionLocalization("fr", "Le message de fin de live")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("get")
          .setNameLocalization("fr", "voir")
          .setDescription("Get current end of stream message")
          .setDescriptionLocalization("fr", "Voir le message de fin de live")
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setNameLocalization("fr", "modifier")
          .setDescription("Set the end of stream message")
          .setDescriptionLocalization(
            "fr",
            "Modifier le message de fin de live"
          )
          .addStringOption((option) =>
            option
              .setName("offlinemessage")
              .setNameLocalization("fr", "message_hors_ligne")
              .setDescription("End of stream message")
              .setDescriptionLocalization("fr", "Le message de fin de live")
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("onlinemessage")
      .setNameLocalization("fr", "message_en_ligne")
      .setDescription("Online message")
      .setDescriptionLocalization("fr", "Le message de début de live")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("get")
          .setNameLocalization("fr", "voir")
          .setDescription("Get current online message")
          .setDescriptionLocalization("fr", "Voir le message de début de live")
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setNameLocalization("fr", "modifier")
          .setDescription("Set the online message")
          .setDescriptionLocalization(
            "fr",
            "Modifier le message de début de live"
          )
          .addStringOption((option) =>
            option
              .setName("onlinemessage")
              .setNameLocalization("fr", "message_en_ligne")
              .setDescription("Online message")
              .setDescriptionLocalization("fr", "Le message de début de live")
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("referral")
      .setNameLocalization("fr", "affiliation")
      .setDescription("User for the referral link")
      .setDescriptionLocalization("fr", "L'utilisateur pour le lien referral")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("get")
          .setNameLocalization("fr", "voir")
          .setDescription("Get current referral")
          .setDescriptionLocalization("fr", "Voir le referral paramétré")
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setNameLocalization("fr", "modifier")
          .setDescription("Set the referral")
          .setDescriptionLocalization("fr", "Modifier le referral")
          .addStringOption((option) =>
            option
              .setName("displayname")
              .setDescription("The user name (as seen on DLive)")
              .setDescriptionLocalization(
                "fr",
                "Le nom de l'utilisateur (tel qu'on le voit sur DLive)"
              )
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("titleoffline")
      .setNameLocalization("fr", "titre_hors_ligne")
      .setDescription("End of stream title")
      .setDescriptionLocalization("fr", "Le titre de l'alerte en fin de live")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("get")
          .setNameLocalization("fr", "voir")
          .setDescription("Get current end of stream alert title")
          .setDescriptionLocalization(
            "fr",
            "Voir le titre de l'alerte en fin de live"
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setNameLocalization("fr", "modifier")
          .setDescription("Set the end of stream alert title")
          .setDescriptionLocalization(
            "fr",
            "Modifier le titre de l'alerte en fin de live"
          )
          .addStringOption((option) =>
            option
              .setName("titleoffline")
              .setNameLocalization("fr", "titre_hors_ligne")
              .setDescription("End of stream alert title")
              .setDescriptionLocalization(
                "fr",
                "Le titre de l'alerte en fin de live"
              )
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("titleonline")
      .setNameLocalization("fr", "titre_en_ligne")
      .setDescription("Online title")
      .setDescriptionLocalization("fr", "Le titre de l'alerte pendant le live")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("get")
          .setNameLocalization("fr", "voir")
          .setDescription("Get current online alert title")
          .setDescriptionLocalization(
            "fr",
            "Voir le titre de l'alerte pendant le live"
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setNameLocalization("fr", "modifier")
          .setDescription("Set the online alert title")
          .setDescriptionLocalization(
            "fr",
            "Modifier le titre de l'alerte pendant le live"
          )
          .addStringOption((option) =>
            option
              .setName("titleonline")
              .setNameLocalization("fr", "titre_en_ligne")
              .setDescription("Online alert title")
              .setDescriptionLocalization(
                "fr",
                "Le titre de l'alerte pendant le live"
              )
              .setRequired(true)
          )
      )
  )
  .toJSON();

const func = async ({ interaction, botState }) => {
  const commandName = interaction.options.getSubcommand();
  const commandGroup = interaction.options.getSubcommandGroup();

  funcs[commandGroup][commandName]({
    interaction,
    botState,
  });
};

module.exports = {
  commandData,
  func,
};
