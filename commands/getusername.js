const { SlashCommandBuilder } = require("@discordjs/builders");
const { createMessageOptions } = require("../helpers/message");
const { getUsername } = require("../helpers/request");

const commandData = new SlashCommandBuilder()
  .setName("getusername")
  .setDescription("Find the name of a user")
  .setDescriptionLocalization("fr", "Trouver l'username d'un utilisateur")
  .setDefaultMemberPermissions("0")
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
  .toJSON();

const func = async ({ interaction }) => {
  const displayname = interaction.options.getString("displayname");

  getUsername(displayname)
    .then((username) => {
      if (username) {
        const locales = {
          fr: `L'username de ${displayname} est :\n${username}`,
          "en-US": `The username of ${displayname} is:\n${username}`,
        };
        interaction.reply(
          createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
        );
      } else {
        const locales = {
          fr: `Aucun username a été trouvé pour ${displayname}\nVérifiez votre saisie`,
          "en-US": `No username found for ${displayname}\nPlease check your input`,
        };
        interaction.reply(
          createMessageOptions(locales[interaction.locale] ?? locales["en-US"])
        );
      }
    })
    .catch((error) => console.log(error));
};

module.exports = {
  commandData,
  func,
};
