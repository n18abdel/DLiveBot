const _ = require("lodash");
const Discord = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const settingsDefault = require("../settings");
const { createMessageOptions, embedFieldData } = require("../helpers/message");
const { delayExplainer } = require("../constants");

const commandData = new SlashCommandBuilder()
  .setName("help")
  .setNameLocalization("fr", "aide")
  .setDescription("Display a description of the bot")
  .setDescriptionLocalization("fr", "Affiche une aide à propos des commandes")
  .setDefaultMemberPermissions("0")
  .toJSON();

const func = async ({ interaction, botState }) => {
  const { guildId } = interaction;
  const { settings } = botState;
  if (!settings[guildId]) settings[guildId] = _.cloneDeep(settingsDefault);

  const help = new Discord.MessageEmbed()
    .setTitle("DLiveBot")
    .setColor(settings[guildId].color)
    .setDescription(
      {
        fr: "Permet d'envoyer une notification sur le canal alerte lorsqu'un des streamers ajoutés commence un live",
      }[interaction.locale] ??
        "Send a notification on the alert channel when a configured streamer goes live"
    )
    .addFields(
      [
        ["\u200b", "\u200b"],
        [
          {
            fr: "Qui peut paramétrer ce bot ?",
          }[interaction.locale] ?? "Who can setup this bot ?",
          {
            fr: "Les administrateurs du serveur",
          }[interaction.locale] ?? "Server administrators",
        ],
        ["\u200b", "\u200b"],
        [
          {
            fr: "Gérer les alertes",
          }[interaction.locale] ?? "Manage alerts",
          {
            fr: "/alertes ...",
          }[interaction.locale] ?? "/alerts ...",
        ],
        [
          {
            fr: "Voir ou modifier les réglages",
          }[interaction.locale] ?? "Manage settings",
          {
            fr: "réglages",
          }[interaction.locale] ?? "/settings ...",
        ],
        ["\u200b", "\u200b"], // blank field
        [
          {
            fr: "Trouver l'username d'un utilisateur",
          }[interaction.locale] ?? "Find the username of a user",
          "/getusername",
          true,
        ],
        [
          {
            fr: "Exemple",
          }[interaction.locale] ?? "Example",
          "/getusername <displayname>",
          true,
        ],
        ["\u200b", "\u200b"],
        [
          {
            fr: "À propos du délai",
          }[interaction.locale] ?? "About the delay",
          delayExplainer[interaction.locale] ?? delayExplainer["en-US"],
        ],
      ].map(embedFieldData)
    );
  const message = createMessageOptions(help, { embed: true });
  interaction.reply(message).catch((error) => console.log(error));
};

module.exports = {
  commandData,
  func,
};
