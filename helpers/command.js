const glob = require("glob");

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
    Object.values(commands).map((command) => ({
      ...command.commandData,
    }))
  );
};

module.exports = { loadCommands, clearCommands, upsertCommands };
