const { createMessageOptions } = require("../helpers/message");
const { getUsername } = require("../helpers/request");

const commandData = {
  name: "get_username",
  description: "Trouver l'username d'une personne",
  options: [
    {
      name: "displayname",
      type: "STRING",
      description: "Le nom du streamer (tel qu'on le voit sur DLive)",
      required: true,
    },
  ],
  defaultPermission: false,
};

const func = async ({ interaction, args }) => {
  const displayname = args.displayname;

  getUsername(displayname)
    .then((response) => {
      if (response.userByDisplayName) {
        const username = response.userByDisplayName.username;
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

const get_username = {
  commandData,
  func,
};

module.exports = get_username;
