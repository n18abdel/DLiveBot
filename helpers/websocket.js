const ChatWebSocket = require("./websocket/ChatWebSocket");
const ChestWebSocket = require("./websocket/ChestWebSocket");

const addWebSockets = (username, displayname, guildId, channelId, botState) => {
  const { websockets } = botState;
  const chatSocket = new ChatWebSocket(
    username,
    displayname,
    guildId,
    channelId,
    botState
  );
  const chestSocket = new ChestWebSocket(
    username,
    displayname,
    guildId,
    channelId,
    botState
  );
  websockets[guildId].push(chatSocket);
  websockets[guildId].push(chestSocket);
};

const closeWebSockets = async (websockets, guildId) => {
  if (websockets[guildId]) {
    websockets[guildId].forEach((socket) => {
      socket.close();
    });
  }
};

module.exports = {
  ChatWebSocket,
  ChestWebSocket,
  addWebSockets,
  closeWebSockets,
};
