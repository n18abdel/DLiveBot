const Discord = require("discord.js");

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
      const { name, value, type, innerOptions } = option;
      if (value) args[name] = value;
      else args = { name, type, options: innerOptions };
    });
  }
  return args;
};

module.exports = { clearCommands, upsertCommands, getOptions };
