const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { bot } = require('./config.json'); // Include your bot's client ID, guild ID, and token in config.json

const rest = new REST({ version: '9' }).setToken(bot.token);

rest.get(Routes.applicationGuildCommands(bot.applicationId, bot.guildId))
    .then(commands => {
        // Find and delete the specific command
        const command = commands.find(cmd => cmd.name === 'temproll'); // Replace 'command_name' with the name of the command you want to delete

        if (!command) {
            console.log('Command not found.');
            return;
        }

        return rest.delete(Routes.applicationGuildCommand(bot.applicationId, bot.guildId, command.id));
    })
    .then(() => console.log('Successfully deleted command'))
    .catch(console.error);
