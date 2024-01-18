const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

let commands = [];

const registerCommands = {
    addCommands: (newCommands) => {
        commands = commands.concat(newCommands);
    },
    register: async (clientId, guildId, token) => {
        const rest = new REST({ version: '10' }).setToken(token);
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
            .then(() => console.log('Successfully registered application commands.'))
            .catch(console.error);
    }
};

module.exports = registerCommands;
