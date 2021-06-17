/**
 * delay in minutes: (put 0 to disable)
 * if two streams 1 and 2 with the same title start successively
 * and startTimeStream2 - endTimeStream1 < sameTitleDelay
 * then only one alert message will be sent
 */
const sameTitleDelayDefault = 5;

// color used for Discord embed messages
const colorDefault = "#ffd300";

/**
 * referral username to use
 * (username is different than the displayname
 *  - we can change displayname monthly
 *    but the username is fixed)
 *
 * you can use the command dbot_get_username <displayname>
 * (displayname is what you see on DLive)
 */
const referralUsernameDefault = "son-son";

// footer for alert messages
const footerDefault = "Provided by Son Son Association Enterprise®";

// message to display when the stream goes on
const onlineMessageDefault = "Hey @everyone <displayname> est en direct";

// message to display on the embed message when the stream goes off
const offlineMessageDefault =
  "Le stream est fini :yeshaha:" +
  "\n" +
  "À la prochaine kaiser :sourire:" +
  "\n\n" +
  "Clique sur le lien pour voir la rediff :ohhhhh:";

// title to display on the message embed alert, when the stream is on
const titleOnlineDefault =
  ":red_circle: **<displayname> est en direct sur DLive !**";

// title to display on the message embed, when the stream is off
const titleOfflineDefault =
  ":white_circle: **<displayname> était en direct sur DLive**";

// one of those values is chosen, each time the chest value is updated
const chestNamesDefault = ["Coffrio", "El coffro", "El coffrito"];

const settingsDefault = {
  sameTitleDelay: sameTitleDelayDefault,
  color: colorDefault,
  referralUsername: referralUsernameDefault,
  footer: footerDefault,
  onlineMessage: onlineMessageDefault,
  offlineMessage: offlineMessageDefault,
  titleOnline: titleOnlineDefault,
  titleOffline: titleOfflineDefault,
  chestNames: chestNamesDefault,
};

module.exports = settingsDefault;
