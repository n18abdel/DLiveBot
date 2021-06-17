const { updateDatabase } = require("../helpers/db");
const { createMessageOptions } = require("../helpers/message");
const {
  createChatWebSocket,
  createChestWebSocket,
} = require("../helpers/request");

const commandData = {
  name: "add",
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
};

const func = async ({ interaction, guildId, channelId, args, botState }) => {
  const {
    settings,
    wasLive,
    alertHistory,
    lastStreams,
    alertChannels,
    websockets,
  } = botState;

  const displayname = args.displayname;

  if (!(guildId in wasLive)) {
    websockets[guildId] = [];
    wasLive[guildId] = {};
    alertHistory[guildId] = {};
    lastStreams[guildId] = {};
    alertChannels[guildId] = channelId;
    await updateDatabase(
      wasLive,
      alertChannels,
      alertHistory,
      lastStreams,
      settings
    );
  }
  if (displayname in wasLive[guildId]) {
    interaction
      .reply(createMessageOptions(`Une alerte existe déjà pour ${displayname}`))
      .catch((error) => console.log(error));
  } else {
    wasLive[guildId][displayname] = false;
    await updateDatabase(
      wasLive,
      alertChannels,
      alertHistory,
      lastStreams,
      settings
    );

    let ws = createChatWebSocket(displayname, guildId, channelId, botState);
    let cs = createChestWebSocket(displayname, guildId, channelId, botState);
    websockets[guildId].push(ws);
    websockets[guildId].push(cs);

    interaction
      .reply(createMessageOptions(`Alerte paramétrée pour ${displayname}`))
      .catch((error) => console.log(error));
  }
};

const add = {
  commandData,
  func,
};

module.exports = add;
