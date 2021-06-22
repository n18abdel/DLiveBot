const admin = require("firebase-admin");

const serviceAccount = {
  type: process.env.type,
  project_id: process.env.project_id,
  private_key_id: process.env.private_key_id,
  private_key: process.env.private_key,
  client_email: process.env.client_email,
  client_id: process.env.client_id,
  auth_uri: process.env.auth_uri,
  token_uri: process.env.token_uri,
  auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.client_x509_cert_url,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const moment = require("moment-timezone");
const settingsDefault = require("../settings");

const timezone = "Europe/Paris";

/**
 * Update the Cloud Firestore database with the current state of the bot
 *
 * @param {object} wasLive
 * @param {object} alertChannels
 * @param {object} alertHistory
 * @param {object} lastStreams
 * @param {object} settings
 */
const updateDatabase = async (
  wasLive,
  alertChannels,
  alertHistory,
  lastStreams,
  settings
) => {
  await db.collection("dlivebot").doc("wasLive").set(wasLive);
  await db.collection("dlivebot").doc("alertChannels").set(alertChannels);
  await db.collection("dlivebot").doc("alertHistory").set(alertHistory);
  await db.collection("dlivebot").doc("lastStreams").set(lastStreams);
  await db.collection("dlivebot").doc("settings").set(settings);
};

/**
 * Retrieve the previous state of the bot from Cloud Firestore database
 */
const parseDatabase = async () => {
  let wasLive = await db.collection("dlivebot").doc("wasLive").get();
  wasLive = wasLive.data();
  let alertChannels = await db
    .collection("dlivebot")
    .doc("alertChannels")
    .get();
  alertChannels = alertChannels.data();
  let alertHistory = await db.collection("dlivebot").doc("alertHistory").get();
  alertHistory = alertHistory.data();
  let lastStreams = await db.collection("dlivebot").doc("lastStreams").get();
  lastStreams = lastStreams.data();
  let settings = await db.collection("dlivebot").doc("settings").get();
  settings = settings.data();
  if (
    wasLive == null ||
    alertChannels == null ||
    alertHistory == null ||
    lastStreams == null ||
    settings == null ||
    Object.values(settings).every(
      (guildSettings) =>
        !Object.keys(settingsDefault).every((element) =>
          Object.keys(guildSettings).includes(element)
        )
    )
  ) {
    await updateDatabase({}, {}, {}, {}, {});
    await parseDatabase();
  }
  return { wasLive, alertChannels, alertHistory, lastStreams, settings };
};

/**
 * Log the last loginTime
 *
 * @param {number} maxLoginsToLog
 */
const logLoginTime = (maxLoginsToLog = 10) => {
  const loginTime = moment().tz(timezone);
  const loginTimeRef = db.collection("dlivebot").doc("loginTime");
  loginTimeRef.get().then((docSnapshot) => {
    let loginTimeObj;
    if (docSnapshot.exists) {
      loginTimeObj = docSnapshot.data();
      while (Object.keys(loginTimeObj).length >= maxLoginsToLog) {
        const keyToRemove = Object.keys(loginTimeObj).sort(
          (a, b) => Number(a) - Number(b)
        )[0];
        delete loginTimeObj[keyToRemove];
      }
    } else {
      loginTimeObj = {};
    }
    loginTimeObj[loginTime.unix()] = loginTime.toString();
    loginTimeRef.set(loginTimeObj);
  });
};

module.exports = {
  parseDatabase,
  updateDatabase,
  logLoginTime,
};
