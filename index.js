// Importing configuration and required libraries
const config = require("./config.json");
const { Client, GatewayIntentBits } = require("discord.js");

// Importing bot modules
const reactionRoles = require("./botModules/reactionRoles");
const checkTwitchStream = require("./botModules/discordStreamers");
const xpRoles = require("./botModules/xpRoles");

// Importing commands
const diceRoll = require("./commands/diceRoll");
const serverXp = require("./commands/serverXp");
const registerCommands = require("./commands/registerCommands");

// Creating Discord Client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
    partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

// Client's 'ready' event handler
client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Initializing modules
    reactionRoles(client, config.reactionRoles);
    checkTwitchStream(client, config.discordStreamers);

    // Setup xpRoles module
    if (config.xpRoles.enabled) {
        xpRoles.setup(client, config.xpRoles);
    }

    // Initializing commands
    diceRoll(client, config);
    serverXp(client, config);

    // Register commands after a delay
    setTimeout(async () => {
        await registerCommands.register(
            config.bot.applicationId,
            config.bot.guildId,
            config.bot.token
        );
    }, 1000); // Delay in milliseconds (1000 milliseconds = 1 second)
});

// Log in to Discord with the bot's token
client.login(config.bot.token);
