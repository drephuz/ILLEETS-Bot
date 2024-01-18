module.exports = async (client, config) => {
    console.log("XP System module loaded");
    const { SlashCommandBuilder } = require('@discordjs/builders');
    const registerCommands = require('./registerCommands');
    const { MongoClient } = require("mongodb");

    const clientId = config.bot.applicationId;
    const guildId = config.bot.guildId;
    const token = config.bot.token;

    // MongoDB connection
    const mongoClient = new MongoClient("mongodb://localhost:27017");
    let xpDb;
    let lastStartupTime;
    let firstInterval;
    try {
        await mongoClient.connect();
        console.log("Connected to MongoDB for XP System");
        xpDb = mongoClient.db("ServerXpDb");
        const uptimeCollection = xpDb.collection("serverUptime");
        const uptimeRecord = await uptimeCollection.findOne({ _id: "uptimeRecord" });

        const currentTime = new Date();
        let timeSinceLastStartup = currentTime - lastStartupTime;

        firstInterval = 7200000 - timeSinceLastStartup; // 2 hours in milliseconds - elapsed time
        if (firstInterval < 0) firstInterval = 0;


        if (uptimeRecord) {
            lastStartupTime = uptimeRecord.lastStartupTime;
        } else {
            lastStartupTime = new Date();
            await uptimeCollection.insertOne({ _id: "uptimeRecord", lastStartupTime: lastStartupTime });
        }

    } catch (error) {
        console.error("Failed to connect to MongoDB for XP System:", error);
        return;
    }

    

    // Registering commands
    const xpCommands = [
        // Separate command for checking XP
        new SlashCommandBuilder()
            .setName('xpcheck')
            .setDescription('Check your XP')
            .toJSON(),
    
        // Other XP commands
        new SlashCommandBuilder()
            .setName('xp')
            .setDescription('XP management commands')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('give')
                    .setDescription('Give XP to a user')
                    .addUserOption(option =>
                        option.setName('user')
                            .setDescription('The user to give XP to')
                            .setRequired(true))
                    .addIntegerOption(option =>
                        option.setName('amount')
                            .setDescription('Amount of XP to give')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('reset-all')
                    .setDescription('Reset XP for all users'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('reset')
                    .setDescription('Reset XP for a specific user')
                    .addUserOption(option =>
                        option.setName('user')
                            .setDescription('The user to reset XP for')
                            .setRequired(true)))
            .toJSON()
    ];
    

    registerCommands.addCommands(xpCommands);

    // Interaction handler
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;
    
        if (interaction.commandName === 'xpcheck') {
            // Handle 'xpcheck' command
            const xp = await getUserXp(interaction.user.id);
            await interaction.reply(`You have ${xp} XP.`);
        } else if (interaction.commandName === 'xp') {
            // Restrict 'xp' subcommands to moderators
            if (!interaction.member.permissions.has('MODERATE_MEMBERS')) {
                await interaction.reply('You do not have permission to use this command.');
                return;
            }
    
            const subcommand = interaction.options.getSubcommand();
    
            switch (subcommand) {
                case 'give':
                    const userOption = interaction.options.getUser('user');
                    const amountOption = interaction.options.getInteger('amount');
                    await giveXp(userOption.id, amountOption);
                    await interaction.reply(`Gave ${amountOption} XP to <@${userOption.id}>.`);
                    break;
                case 'reset-all':
                    await resetAllXp();
                    await interaction.reply('All users\' XP has been reset.');
                    break;
                case 'reset':
                    const resetUser = interaction.options.getUser('user');
                    await resetUserXp(resetUser.id);
                    await interaction.reply(`XP reset for <@${resetUser.id}>.`);
                    break;
            }
        }
    });
    

    // XP functions
    async function getUserXp(userId) {
        const user = await xpDb.collection("users").findOne({ userId: userId });
        return user ? user.xp : 0;
    }

    async function giveXp(userId, amount) {
        const user = await xpDb.collection("users").findOne({ userId: userId });
        const newXP = Math.max((user?.xp || 0) + amount, 0);
        await xpDb.collection("users").updateOne(
            { userId: userId },
            { $set: { xp: newXP } },
            { upsert: true }
        );
    }

    async function resetAllXp() {
        // Reset XP for all users
        await xpDb.collection("users").updateMany({}, { $set: { xp: 0 } });
    }

    async function resetUserXp(userId) {
        // Reset XP for a specific user
        await xpDb.collection("users").updateOne({ userId: userId }, { $set: { xp: 0 } });
    }

    // Message listener for tracking messages and incrementing XP
client.on('messageCreate', async message => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Increment XP by 6 for each message sent
    await giveXp(message.author.id, 6);
});

// Scheduled task for deducting 1 XP from all users every 2 hours
if (firstInterval > 0) {
    setTimeout(() => deductXpFromAllUsers(1), firstInterval);
}
setInterval(() => deductXpFromAllUsers(1), 7200000); // Regular 2-hour interval

// Function to deduct XP from all users
async function deductXpFromAllUsers(amount) {
    const users = await xpDb.collection("users").find({}).toArray();
    for (const user of users) {
        const newXP = Math.max(user.xp - amount, 0);
        await xpDb.collection("users").updateOne(
            { userId: user.userId },
            { $set: { xp: newXP } }
        );

        // Now check for role change
        const member = await guild.members.fetch(user.userId).catch(console.error);
        if (!member) continue; // Skip if member not found

        // This logic is similar to what you have in the messageCreate event
        let newRoleName = '';
        let roleChangeMessage = '';
        let roles = ['Inactive', 'Active', 'Very Chatty', 'Living Here'];

        if (newXP >= 0 && newXP <= 5) {
            newRoleName = roles[0];
            roleChangeMessage = `Awww, we miss you ${member.displayName}, you've been marked as Inactive.`;
        } else if (newXP >= 6 && newXP <= 500) {
            newRoleName = roles[1];
            roleChangeMessage = `Congratulations! You've acquired the Active role, ${member.displayName}!`;
        } else if (newXP >= 501 && newXP <= 1499) {
            newRoleName = roles[2];
            roleChangeMessage = `Wow, ${member.displayName}, you're Very Chatty! Enjoy your new role!`;
        } else if (newXP >= 1500) {
            newRoleName = roles[3];
            roleChangeMessage = `Incredible, ${member.displayName}! You've been so active that you now 'Live Here'!`;
        }

        if (newRoleName) {
            const role = guild.roles.cache.find(r => r.name === newRoleName);
            if (role) {
                
                await member.roles.add([role]).catch(console.error); // This sets only the specific role

                switch (role.name) {
                    case 'Inactive':
                        const roleToRemove1 = guild.roles.cache.find(r => r.name === roles[1]);
                        member.roles.remove(roleToRemove1).catch(console.error);
                        const roleToRemove2 = guild.roles.cache.find(r => r.name === roles[2]);
                        member.roles.remove(roleToRemove2).catch(console.error);
                        const roleToRemove3 = guild.roles.cache.find(r => r.name === roles[3]);
                        member.roles.remove(roleToRemove3).catch(console.error);
                        break;
                    case 'Active':
                        const roleToRemove4 = guild.roles.cache.find(r => r.name === roles[0]);
                        member.roles.remove(roleToRemove4).catch(console.error);
                        const roleToRemove5 = guild.roles.cache.find(r => r.name === roles[2]);
                        member.roles.remove(roleToRemove5).catch(console.error);
                        const roleToRemove6 = guild.roles.cache.find(r => r.name === roles[3]);
                        member.roles.remove(roleToRemove6).catch(console.error);
                        break;
                    case 'Very Chatty':
                        const roleToRemove7 = guild.roles.cache.find(r => r.name === roles[0]);
                        member.roles.remove(roleToRemove7).catch(console.error);
                        const roleToRemove8 = guild.roles.cache.find(r => r.name === roles[1]);
                        member.roles.remove(roleToRemove8).catch(console.error);
                        const roleToRemove9 = guild.roles.cache.find(r => r.name === roles[3]);
                        member.roles.remove(roleToRemove9).catch(console.error);
                        break;
                    case 'Living Here':
                        const roleToRemove10 = guild.roles.cache.find(r => r.name === roles[0]);
                        member.roles.remove(roleToRemove10).catch(console.error);
                        const roleToRemove11 = guild.roles.cache.find(r => r.name === roles[1]);
                        member.roles.remove(roleToRemove11).catch(console.error);
                        const roleToRemove12 = guild.roles.cache.find(r => r.name === roles[2]);
                        member.roles.remove(roleToRemove12).catch(console.error);
                        break;                       
                }
                const channel = guild.channels.cache.find(c => c.name === "general"); // Replace with your channel
                if (channel) channel.send(roleChangeMessage);
            }
        }
    }
}
};
