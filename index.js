const config = require('./config.json');
const { Client, GatewayIntentBits } = require('discord.js');
const reactionRoles = require('./reactionRoles');
const checkTwitchStream = require('./checkTwitchStream');
const diceRoll = require('./diceRoll');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    reactionRoles(client, config.reactionRoles);
    checkTwitchStream(client, config.checkTwitchStream);
    diceRoll(client, config.diceRoll);
});

// Replace with your bot token
client.login(config.bot.token);
