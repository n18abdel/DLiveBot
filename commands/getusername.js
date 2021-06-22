const { createMessageOptions } = require("../helpers/message");
const { getUsername } = require("../helpers/request");

const commandData = {
  name: "getusername",
  description: "Trouver l'username d'un utilisateur",
  options: [
    {
      name: "displayname",
      type: "STRING",
      description: "Le nom de l'utilisateur (tel qu'on le voit sur DLive)",
      required: true,
    },
  ],
  defaultPermission: false,
};

const func = async ({ interaction, args }) => {
  const { displayname } = args;

  getUsername(displayname)
    .then((username) => {
      if (username) {
        interaction.reply(
          createMessageOptions(`L'username de ${displayname} est:\n${username}`)
        );
      } else {
        interaction.reply(
          createMessageOptions(
            `Aucun username a été trouvé pour ${displayname}\nVérifiez votre saisie`
          )
        );
      }
    })
    .catch((error) => console.log(error));
};

module.exports = {
  commandData,
  func,
};
