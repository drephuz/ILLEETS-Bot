//initializing configuration and modules into variables.
const config = require('./config.json');
const { Client, GatewayIntentBits } = require('discord.js');

//load modules
const reactionRoles = require('./botModules/reactionRoles');
const checkTwitchStream = require('./botModules/discordStreamers');
const xpRoles = require('./botModules/xpRoles');
//load commands
const diceRoll = require('./commands/diceRoll');
const serverXp = require('./commands/serverXp');
const registerCommands = require('./commands/registerCommands');

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
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    reactionRoles(client, config.reactionRoles);
    checkTwitchStream(client, config.discordStreamers);
    xpRoles(client, config);

    diceRoll(client, config);
    serverXp(client, config);

    //temporary delay until I figure out how to wait for all modules to load
    setTimeout(async () => {
        await registerCommands.register(config.bot.applicationId, config.bot.guildId, config.bot.token);
    }, 1000); // Delay in milliseconds (1000 milliseconds = 1 second)
    
});


//Actually connect to Discord.  The bot must have joined the server as scope=bot and permissions=8 (Administator)
client.login(config.bot.token);
