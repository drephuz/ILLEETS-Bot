//initializing configuration and modules into variables.
const config = require('./config.json');
const { Client, GatewayIntentBits } = require('discord.js');
const reactionRoles = require('./reactionRoles');
const checkTwitchStream = require('./discordStreamers');
const diceRoll = require('./diceRoll');

//creating Discord Client and claiming bot intents. Look up Discord Bot Intents for clarification
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

//On connect, confirm connection with Bot's name.  Bot>Token must be supplied in config.json
//All modules are called here. Using config.json to enable each module after confirming required 
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    //add additional modules per line after requiring them at the top of the script.  You will likely need to also add additional configuration lines to the config.json
    reactionRoles(client, config.reactionRoles);
    checkTwitchStream(client, config.discordStreamers);
    diceRoll(client, config.diceRoll);
});

//Actually connect to Discord.  The bot must have joined the server as scope=bot and permissions=8 (Administator)
client.login(config.bot.token);
