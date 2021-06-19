const Discord = require("discord.js");
const settingsDefault = require("../settings");
const { createMessageOptions } = require("../helpers/message");
const { delayExplainer } = require("../constants");

const commandData = {
  name: "help",
  description: "Affiche une aide à propos des commandes",
  defaultPermission: false,
};

const func = async ({ interaction, guildId, botState }) => {
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = settingsDefault;

  const help = new Discord.MessageEmbed()
    .setTitle("DLiveBot")
    .setColor(settings[guildId].color)
    .setDescription(
      "Permet d'envoyer une notification sur le canal alerte lorsqu'un des streamers ajoutés commence un live"
    )
    .addField("\u200b", "\u200b")
    .addField("Qui peut paramétrer ce bot ?", "Les administrateurs du serveur")
    .addField("\u200b", "\u200b")
    .addField("Ajouter une alerte", "/add <nom_du_streamer>", true)
    .addField("Exemple", "/add Marvelfit", true)
    .addField("Voir les alertes existantes", "/get")
    .addField("Retirer toutes les alertes", "/clear")
    .addField("\u200b", "\u200b") // blank field
    .addField("Trouver l'username d'une personne", "/get_username", true)
    .addField("Exemple", "/get_username <displayname>", true)
    .addField("\u200b", "\u200b")
    .addField("Voir le délai paramétré", "/get_delay")
    .addField("Modifier le délai", "/set_delay", true)
    .addField("Exemple", "/set_delay 10", true)
    .addField("À propos du délai", delayExplainer);
  const message = createMessageOptions(help, { embed: true });
  interaction.reply(message).catch((error) => console.log(error));
};

module.exports = {
  commandData,
  func,
};
