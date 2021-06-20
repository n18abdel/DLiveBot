const https = require("https");

// ================= REQUEST HELPERS ===================
// options for http requests on DLive GraphQL API
const requestOptions = {
  hostname: "graphigo.prd.dlive.tv",
  port: 443,
  path: "/",
  method: "POST",
  headers: {
    accept: "*/*",
    "content-type": "application/json",
    Origin: "https://dlive.tv",
  },
};
/**
 * Do an http request with the inputed data
 *
 * @param {object} data
 */
const request = (data) =>
  new Promise((resolve, reject) => {
    const { operationName, ...toPost } = data;
    const postData = JSON.stringify(toPost);
    const req = https.request(requestOptions, (res) => {
      res.setEncoding("utf-8");
      res.on("data", (responseText) => {
        const response = JSON.parse(responseText).data;
        resolve(response[operationName]);
      });
      res.on("error", (error) => reject(error));
    });
    req.write(postData);
    req.end();
  });

/**
 * Retrieve the DLive username (different than displayname)
 *
 * @param {string} displayname
 */
const getUsername = (displayname) =>
  request({
    operationName: "userByDisplayName",
    query: `query LivestreamPage($displayname: String!) {
      userByDisplayName(displayname: $displayname) {
        username
        __typename
      }
    }`,
    variables: {
      displayname,
    },
  }).then((user) => (user ? user.username : null));

/**
 * Retrieve the DLive displayname (different than username)
 *
 * @param {string} username
 */
const getDisplayname = (username) =>
  request({
    operationName: "user",
    query: `query User($username: String!) {
      user(username: $username) {
        displayname
        __typename
      }
    }`,
    variables: {
      username,
    },
  }).then((user) => user.displayname);

/**
 * Retrieve current stream info
 *
 * @param {string} username
 */
const getStreamInfo = (username) =>
  request({
    operationName: "user",
    query: `query LivestreamPage($username: String!) {
      user(username: $username) {
        livestream {
          title
          thumbnailUrl
          watchingCount
          createdAt
          category {
            title
            imgUrl
            __typename
          }
          totalReward
          permlink
          __typename
        }
        lastStreamedAt
        offlineImage
        displayname
        __typename
      }
    }`,
    variables: {
      username,
    },
  });

module.exports = {
  getUsername,
  getDisplayname,
  getStreamInfo,
};
