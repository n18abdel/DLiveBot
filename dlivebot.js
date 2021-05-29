'use strict';

const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('dlivebot is alive!'));

app.listen(port);

const https = require('https');

// ================= START BOT CODE ===================
const alertMaxDelay = 30 ; // in seconds

const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');

const parseDatabase = () => {
  wasLive = JSON.parse(fs.readFileSync("wasLive.txt").toString());
  channels = JSON.parse(fs.readFileSync("channels.txt").toString());
}

const updateDatabase = (wasLive, channels) => {
  fs.writeFile("wasLive.txt", JSON.stringify(wasLive), (error) => {
    if (error) throw err;
  });
  fs.writeFile("channels.txt", JSON.stringify(channels), (error) => {
    if (error) throw err;
  });
};

const generateOptions = () => {
    const options = {
        hostname: "graphigo.prd.dlive.tv",
        port: 443,
        path: "/",
        method: "POST",
        headers: {
            accept: "*/*",
            'content-type': "application/json",
            Origin: "https://dlive.tv"
        }
    };
    return options;
};

const request = (data) => new Promise((resolve, reject) => {
	const postData = (typeof data === 'object') ? JSON.stringify(data) : data;
  const options = generateOptions();
	const req = https.request(options, (res) => {
    res.setEncoding("utf-8");
    res.on("data", (responseText) => {
      const response = JSON.parse(responseText).data;
      resolve(response);
    });
    res.on("error", (error) => reject(error));
  });
  req.write(postData);
  req.end();
});

const isLiveRequest = displayname => request({
    operationName: 'LivestreamPage',
    query: `query LivestreamPage($displayname: String!, $add: Boolean!, $isLoggedIn: Boolean!) {
        userByDisplayName(displayname: $displayname) {
          id
          ...VDliveAvatarFrag
          ...VDliveNameFrag
          ...VFollowFrag
          ...VSubscriptionFrag
          banStatus
          deactivated
          about
          avatar
          myRoomRole @include(if: $isLoggedIn)
          isMe @include(if: $isLoggedIn)
          isSubscribing @include(if: $isLoggedIn)
          livestream {
            id
            permlink
            watchTime(add: $add)
            ...LivestreamInfoFrag
            ...VVideoPlayerFrag
            __typename
          }
          hostingLivestream {
            id
            creator {
              ...VDliveAvatarFrag
              displayname
              username
              __typename
            }
            ...VVideoPlayerFrag
            __typename
          }
          ...LivestreamProfileFrag
          __typename
        }
      }
      
      fragment LivestreamInfoFrag on Livestream {
        category {
          title
          imgUrl
          id
          backendID
          __typename
        }
        title
        watchingCount
        totalReward
        ...VDonationGiftFrag
        ...VPostInfoShareFrag
        __typename
      }
      
      fragment VDonationGiftFrag on Post {
        permlink
        creator {
          username
          __typename
        }
        __typename
      }
      
      fragment VPostInfoShareFrag on Post {
        permlink
        title
        content
        category {
          id
          backendID
          title
          __typename
        }
        __typename
      }
      
      fragment VDliveAvatarFrag on User {
        avatar
        __typename
      }
      
      fragment VDliveNameFrag on User {
        displayname
        partnerStatus
        __typename
      }
      
      fragment LivestreamProfileFrag on User {
        isMe @include(if: $isLoggedIn)
        canSubscribe
        private @include(if: $isLoggedIn) {
          subscribers {
            totalCount
            __typename
          }
          __typename
        }
        videos {
          totalCount
          __typename
        }
        pastBroadcasts {
          totalCount
          __typename
        }
        followers {
          totalCount
          __typename
        }
        following {
          totalCount
          __typename
        }
        ...ProfileAboutFrag
        __typename
      }
      
      fragment ProfileAboutFrag on User {
        id
        about
        __typename
      }
      
      fragment VVideoPlayerFrag on Livestream {
        disableAlert
        category {
          id
          title
          __typename
        }
        language {
          language
          __typename
        }
        __typename
      }
      
      fragment VFollowFrag on User {
        id
        username
        displayname
        isFollowing @include(if: $isLoggedIn)
        isMe @include(if: $isLoggedIn)
        followers {
          totalCount
          __typename
        }
        __typename
      }
      
      fragment VSubscriptionFrag on User {
        id
        username
        displayname
        isSubscribing @include(if: $isLoggedIn)
        canSubscribe
        isMe @include(if: $isLoggedIn)
        __typename
      }
      
        `,
    variables: {
      displayname,
      isLoggedIn: false,
      add: false
    }}).catch(error => console.log(error));

const initializeInterval = (displayname, guildId, channel) => {
  return setInterval(() => {
  isLiveRequest(displayname).then(response => {
    let stream = response["userByDisplayName"]["livestream"]
    let isLive = !(stream == null);
    if (!wasLive[guildId][displayname] && isLive) {
      wasLive[guildId][displayname] = true;
      updateDatabase(wasLive, channels);
      client.channels.cache.get(channel).send(`Hey @everyone ${displayname} est en direct\n${stream.title}\nhttps://dlive.tv/${displayname}?ref=son-son\nProvided by Son Son Association Enterprise`);
    } else if (!isLive) {
      wasLive[guildId][displayname] = false;
      updateDatabase(wasLive, channels);
    }
  })}, alertMaxDelay*1000)
}

let intervals = {};
let wasLive = {};
let channels = {};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  parseDatabase();
  for (let guildId in wasLive){
    intervals[guildId] = [];
    for (let displayname in wasLive[guildId]){
      let channel = channels[guildId];
      let i = initializeInterval(displayname, guildId, channel);
      intervals[guildId].push(i);
    }
  }
  /*
  console.log(client.guilds.cache.get('676184666373357601').me.permissions.toArray())
  console.log(client.channels.cache.get('676185038446133284').permissionsFor(client.user).toArray())
  */
});

// update

client.on('message', msg => {
  let isAdmin = msg.guild.member(msg.author).hasPermission('ADMINISTRATOR');
  if (isAdmin && msg.channel.name.includes('alerte')){
    if (msg.content.startsWith('dbot_add')) {
      const inputs = msg.content.split(' ');
      let displayname = inputs[inputs.length - 1];
      if (!(msg.guild.id in wasLive)) {
        intervals[msg.guild.id] = [];
        wasLive[msg.guild.id] = {};
        channels[msg.guild.id] = msg.channel.id
        updateDatabase(wasLive, channels);
      }
      if (displayname in wasLive[msg.guild.id]) {
        msg.reply(`Une alerte existe déjà pour ${displayname}`)
      } else {
        wasLive[msg.guild.id][displayname] = false;
        updateDatabase(wasLive, channels);
        let i = setInterval(() => {
          isLiveRequest(displayname).then(response => {
            let stream = response["userByDisplayName"]["livestream"]
            let isLive = !(stream == null);
            if (!wasLive[msg.guild.id][displayname] && isLive) {
              wasLive[msg.guild.id][displayname] = true;
              updateDatabase(wasLive, channels);
              msg.channel.send(`Hey @everyone ${displayname} est en direct\n${stream.title}\nhttps://dlive.tv/${displayname}?ref=son-son\nProvided by Son Son Association Enterprise`);
            } else if (!isLive) {
              wasLive[msg.guild.id][displayname] = false;
              updateDatabase(wasLive, channels);
            }
          });
        }, alertMaxDelay*1000);
        intervals[msg.guild.id].push(i);
        msg.reply(`Alerte paramétrée pour ${displayname}`);
      }
    } else if (msg.content == 'dbot_clear'){
      intervals[msg.guild.id].forEach(clearInterval);
      delete wasLive[msg.guild.id];
      delete channels[msg.guild.id];
      updateDatabase(wasLive, channels);
      msg.reply('Toutes les alertes ont été retirées');
    } else if (msg.content == 'dbot_help'){
      const help = new Discord.MessageEmbed()
      .setTitle('dlivebot')
      .setDescription("Permet d'envoyer une notification sur le canal alerte lorsqu'un des streamers ajoutés commence un live (notification dans les 2 minutes après le début du live)")
      .addField('Qui peut paramétrer ce bot ?','Les administrateurs du serveur')
      .addField('Ajouter un streamer', "dbot_add <nom_du_streamer>", true)
      .addField('Exemple', "dbot_add Marvelfit", true)
      .addField('Retirer touts les streamers',"dbot_clear");
      msg.reply(help)
    }
  }
});

/* old

let intervals = [];

client.on('message', msg => {
  let isAdmin = msg.guild.member(msg.author).hasPermission('ADMINISTRATOR');
  if (isAdmin && msg.channel.name.includes('alerte')){
    if (msg.content.startsWith('!add')) {
      const inputs = msg.content.split(' ');
      let displayname = inputs[inputs.length - 1];
      let wasLive = false;
      let i = setInterval(() => {
        isLiveRequest(displayname).then(response => {
          let stream = response["userByDisplayName"]["livestream"]
          let isLive = !(stream == null);
          if (!wasLive && isLive) {
            wasLive = true
            msg.channel.send(`Hey @everyone ${displayname} est en direct\n ${stream.title}\n https://dlive.tv/${displayname}`);
          } else if (!isLive) {
            wasLive = false;
          }
        });
      }, 2*60*1000);
      intervals.push(i);
      msg.reply(`Alerte paramétrée pour ${displayname}`);
    } else if (msg.content == '!clear'){
      intervals.forEach(clearInterval);
      msg.reply('Toutes les alertes ont été retirées')
    } else if (msg.content == '!help'){
      const help = new Discord.MessageEmbed()
      .setTitle('dlivebot')
      .setDescription("Permet d'envoyer une notification sur le canal alerte lorsqu'un des streamers ajoutés commence un live (notification dans les 2 minutes après le début du live)")
      .addField('Qui peut paramétrer ce bot ?','Les administrateurs du serveur')
      .addField('Ajouter un streamer', "!add <nom_du_streamer>", true)
      .addField('Exemple', "!add Marvelfit", true)
      .addField('Retirer touts les streamers',"!clear");
      msg.reply(help)
    }
  }
});

*/

// You really don't want your token here since your repl's code
// is publically available. We'll take advantage of a Repl.it 
// feature to hide the token we got earlier. 
client.login(process.env.DISCORD_TOKEN);