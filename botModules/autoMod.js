const { ActivityType, Permissions } = require("discord.js");
const { MongoClient, ObjectId } = require("mongodb");
const { SlashCommandBuilder } = require("@discordjs/builders");
const registerCommands = require("../commands/registerCommands");

module.exports = async (client, config) => {
    const autoModCommands = [
        // Command for checking warnings
        new SlashCommandBuilder()
            .setName("warnings")
            .setDescription("Check the number of warnings for a user")
            .addUserOption(option =>
                option.setName("user").setDescription("the user to check").setRequired(true))
            .toJSON(),
        new SlashCommandBuilder()
            .setName("warnings-reset")
            .setDescription("Reset all warnings for a user")
            .addUserOption(option =>
                option.setName("user").setDescription("the user to reset").setRequired(true))
            .toJSON()
    ];

    registerCommands.addCommands(autoModCommands);

    console.log("Automod module loaded");
    const messageCache = new Map();
    const mongoClient = new MongoClient("mongodb://localhost:27017");
    let db, warningsCollection;

    try {
        await mongoClient.connect();
        console.log("Connected to MongoDB for Automod");
        db = mongoClient.db("autoMod");
        warningsCollection = db.collection("warnings");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        return;
    }

    client.on("messageCreate", async (message) => {
        if (!config.enabled || message.author.bot) return;

        // Spam Detection
        const isSpam = await detectSpam(message, messageCache);
        if (isSpam) {
            await handleSpam(message);
            return;
        }

        // Blocked Terms and Bannable Terms Detection
        if (config.blockedTerms.enabled) {
            const blockedTerm = checkBlockedTerms(message.content, config.blockedTerms.terms);
            if (blockedTerm) {
                await handleBlockedTerm(message, blockedTerm, warningsCollection);
            }
        }

        if (config.bannableTerms.enabled) {
            const bannableTerm = checkBlockedTerms(message.content, config.bannableTerms.terms);
            if (bannableTerm) {
                await handleBannableTerm(message, bannableTerm, warningsCollection);
            }
        }
    });

    setInterval(async () => {
        try {
            // Logic to reset warnings that are older than 7 days
        } catch (error) {
            console.error("Error in resetting old warnings: ", error);
        }
    }, 2 * 60 * 1000);

    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;
    
        const { commandName, options } = interaction;
    
        if (commandName === 'warnings') {
            const user = options.getUser('user');
            // Fetch warnings for the user and reply
            const userWarnings = await warningsCollection.findOne({ userId: user.id });
            const warningCount = userWarnings ? userWarnings.warnings.length : 0;
            await interaction.reply(`${user.tag} has ${warningCount} warning(s).`);
        } else if (commandName === 'warnings-reset') {
            const user = options.getUser('user');
            // Reset warnings for the user and reply
            await warningsCollection.updateOne({ userId: user.id }, { $set: { warnings: [] } });
            await interaction.reply(`Warnings for ${user.tag} have been reset.`);
        }
    });

};

async function detectSpam(message, cache) {
    const authorId = message.author.id;
    if (!cache.has(authorId)) {
        cache.set(authorId, []);
    }
    const messages = cache.get(authorId);
    messages.push(message.content);

    // Check for spam (3 identical messages in a row)
    if (messages.length >= 3 && messages.slice(-3).every(m => m === message.content)) {
        cache.set(authorId, []); // Clear cache for this user
        return true;
    }

    // Limit cache size
    if (messages.length > 3) {
        messages.shift();
    }

    return false;
}

async function handleSpam(message) {
    try {
        const messages = await message.channel.messages.fetch({ limit: 3 });
        const userMessages = messages.filter(m => m.author.id === message.author.id);
        await message.channel.bulkDelete(userMessages);

        await message.channel.send(`⚠️ Please refrain from spamming, <@${message.author.id}>.`);
    } catch (error) {
        console.error("Error handling spam:", error);
    }
}

async function handleBlockedTerm(message, term, warningsCollection) {
    try {
        const censoredTerm = censorTerm(term);
        await message.channel.send(`⚠️ Warning Issued to <@${message.author.id}> - Inappropriate language detected. Term: ${censoredTerm}`);
        await message.delete(); // Delete the offending message after sending the warning
        await handleWarning(message, message.author.id, warningsCollection);
    } catch (error) {
        console.error("Error handling blocked term:", error);
    }
}


async function handleBannableTerm(message, term, warningsCollection) {
    try {
        const censoredTerm = censorTerm(term);
        await message.channel.send(`⚠️ <@${message.author.id}> Banned - Bannable language detected. Term: ${censoredTerm}`);
        await message.delete(); // Delete the offending message after sending the warning
        const warningResult = await handleWarning(message, message.author.id, warningsCollection);
        // ... handle timeout or ban based on warningResult ...
    } catch (error) {
        console.error("Error handling bannable term:", error);
    }
}


function censorTerm(term) {
    return term[0] + "*".repeat(term.length - 2) + term.slice(-1);
}


function checkBlockedTerms(content, terms) {
    return terms.find(term => content.includes(term));
}

async function handleWarning(message, userId, warningsCollection) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch user's warnings from the database
    let userWarnings = await warningsCollection.findOne({ userId: userId });

    // If there are old warnings, reset them
    if (userWarnings && userWarnings.warnings.some(warning => new Date(warning.date) < sevenDaysAgo)) {
        userWarnings.warnings = userWarnings.warnings.filter(warning => new Date(warning.date) >= sevenDaysAgo);
        await warningsCollection.updateOne({ userId: userId }, { $set: { warnings: userWarnings.warnings } });
    }

    // Add a new warning
    const newWarning = {
        date: new Date().toISOString(),
        warningId: new ObjectId().toString()
    };

    if (!userWarnings) {
        // If the user has no warnings, create a new document
        await warningsCollection.insertOne({ userId: userId, warnings: [newWarning] });
        userWarnings = { warnings: [newWarning] };
    } else {
        // If the user already has warnings, add the new one
        await warningsCollection.updateOne({ userId: userId }, { $push: { warnings: newWarning } });
        userWarnings.warnings.push(newWarning);
    }

    const warningCount = userWarnings.warnings.length;

    // Determine the action based on the number of warnings
    if (warningCount >= 5) {
        // Uncomment the following line to enable banning
        await message.guild.members.ban(userId, { reason: "Received 5th warning within 7 day period" });
        return { action: 'ban' };
    } else if (warningCount >= 3) {
        // Uncomment the following line to enable 1 hour timeout
        await message.member.timeout(60 * 60 * 1000, "Received 3rd or 4th warning within 7 day period");
        return { action: 'hour_timeout' };
    } else {
        // Uncomment the following line to enable 60 seconds timeout
        await message.member.timeout(60 * 1000, "Received 1st or 2nd warning");
        return { action: 'timeout' };
    }
}
