const glob = require("glob");
const Discord = require("discord.js");

const loadCommands = ({ folder, subGroup = false }) => {
  const container = {};
  const files = glob.sync(`**/${folder}${subGroup ? "/**" : ""}/*.js`);

  files.forEach((commandFile) => {
    const commandName = commandFile.match(/.*\/(.*)\.js/)[1];
    if (subGroup) {
      const commandGroup = commandFile.match(/.*\/(.*)\/.*\.js/)[1];
      if (!container[commandGroup]) container[commandGroup] = {};
      container[commandGroup][
        commandName
      ] = `./${folder}/${commandGroup}/${commandName}`;
    } else {
      container[commandName] = `./${folder}/${commandName}`;
    }
  });
  return container;
};

const clearCommands = async (guild, commands) => {
  await guild.commands.fetch().then((existingCommands) =>
    existingCommands.forEach(async (existingCommand) => {
      const { name } = existingCommand;
      if (!(name in commands)) {
        await existingCommand.delete();
      }
    })
  );
};

const upsertCommands = async (guild, commands) => {
  await guild.commands.set(
    Object.values(commands).map((command) => command.commandData)
  );
  // allow admin roles and guild owner
  const roles = guild.roles.cache.filter((role) =>
    role.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)
  );
  const permissions = roles.map((role) => ({
    id: role.id,
    type: "ROLE",
    permission: true,
  }));
  permissions.push({
    id: guild.ownerID,
    type: "USER",
    permission: true,
  });
  await guild.commands.fetch().then(async (existingCommands) => {
    const setPermissionsObj = existingCommands.map((command) => ({
      id: command.id,
      permissions,
    }));
    await guild.commands.setPermissions(setPermissionsObj);
  });
};

const getOptions = (interaction) => {
  const { options } = interaction;
  let args = {};

  if (options) {
    Array.from(options.values()).forEach((option) => {
      const { name, value, type, options: innerOptions } = option;
      if (value) args[name] = value;
      else args = { name, type, options: innerOptions };
    });
  }
  return args;
};

module.exports = { loadCommands, clearCommands, upsertCommands, getOptions };
