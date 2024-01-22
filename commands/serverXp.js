module.exports = async (client, config) => {
    if (config.xpServer.enabled) {
        console.log("XP System module loaded");
        const { SlashCommandBuilder } = require("@discordjs/builders");
        const registerCommands = require("./registerCommands");
        const xpRoles = require("../botModules/xpRoles");
        const { MongoClient } = require("mongodb");
    
        const guildId = config.bot.guildId;
    
        if (config.xpRoles.enabled) {
            console.log("XP Roles Management module loaded");
        }
    
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

            if (uptimeRecord) {
                // Update the existing record with the new startup time
                await uptimeCollection.updateOne(
                    { _id: "uptimeRecord" },
                    { $set: { lastStartupTime: currentTime } }
                );
                lastStartupTime = uptimeRecord.lastStartupTime;
            } else {
                // Insert a new record as it doesn't exist
                lastStartupTime = currentTime;
                await uptimeCollection.insertOne({
                    _id: "uptimeRecord",
                    lastStartupTime: lastStartupTime,
                });
            }

            // Calculate the first interval
            let timeSinceLastStartup = currentTime - lastStartupTime;
            firstInterval = 7200000 - timeSinceLastStartup; // 2 hours in milliseconds - elapsed time
            if (firstInterval < 0) firstInterval = 0;

        } catch (error) {
            console.error("Failed to connect to MongoDB for XP System:", error);
            return;
        }
    
        // Scheduled task for deducting 1 XP from all users every 2 hours
        if (firstInterval > 0) {
            setTimeout(() => deductXpFromAllUsers(1), firstInterval);
        }
        setInterval(() => deductXpFromAllUsers(1), 7200000); // Regular 2-hour interval
    
        // Registering commands
        const xpCommands = [
            new SlashCommandBuilder()
                .setName("xpcheck")
                .setDescription("Check a user's XP")
                .addUserOption(option => 
                    option.setName("user")
                        .setDescription("The user whose XP you want to check")
                        .setRequired(true)
                )
                .toJSON(),
    
            // Other XP commands
            new SlashCommandBuilder()
                .setName("xp")
                .setDescription("XP management commands")
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("give")
                        .setDescription("Give XP to a user")
                        .addUserOption((option) =>
                            option
                                .setName("user")
                                .setDescription("The user to give XP to")
                                .setRequired(true)
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName("amount")
                                .setDescription("Amount of XP to give")
                                .setRequired(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("reset-all")
                        .setDescription("Reset XP for all users")
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("reset")
                        .setDescription("Reset XP for a specific user")
                        .addUserOption((option) =>
                            option
                                .setName("user")
                                .setDescription("The user to reset XP for")
                                .setRequired(true)
                        )
                )
                .toJSON(),
        ];
    
        registerCommands.addCommands(xpCommands);
    
        // Interaction handler
        client.on("interactionCreate", async (interaction) => {
            if (!interaction.isCommand()) return;
        
            if (interaction.commandName === "xpcheck") {
                const targetUser = interaction.options.getUser("user");
                const xp = await getUserXp(targetUser.id);
                // Update the reply to mention the user
                await interaction.reply(`<@${targetUser.id}> has ${xp} XP.`);
            } else if (interaction.commandName === "xp") {
                // Restrict 'xp' subcommands to moderators
    
                const subcommand = interaction.options.getSubcommand();
    
                switch (subcommand) {
                    case "give":
                        const userOption = interaction.options.getUser("user");
                        const amountOption = interaction.options.getInteger(
                            "amount"
                        );
                        await giveXp(userOption.id, amountOption);
                        await interaction.reply(
                            `Gave ${amountOption} XP to <@${userOption.id}>.`
                        );
                        break;
                    case "reset-all":
                        await resetAllXp();
                        await interaction.reply("All users' XP has been reset.");
                        break;
                    case "reset":
                        const resetUser = interaction.options.getUser("user");
                        await resetUserXp(resetUser.id);
                        await interaction.reply(`XP reset for <@${resetUser.id}>.`);
                        break;
                }
            }
        });
    
        // Message listener for tracking messages and incrementing XP
        client.on("messageCreate", async (message) => {
            if (message.author.bot) return;
    
            // Increment XP by 6 for each message sent
            await giveXp(message.author.id, 6);
    
            if (config.xpRoles.enabled) {
                // Update roles after giving XP
                const userData = await xpDb
                    .collection("users")
                    .findOne({ userId: message.author.id });
                const xp = userData ? userData.xp : 0;
                await xpRoles.updateMemberRoles(guildId, message.author.id, xp);
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
            await xpDb
                .collection("users")
                .updateOne(
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
            await xpDb
                .collection("users")
                .updateOne({ userId: userId }, { $set: { xp: 0 } });
        }
    
        // Function to deduct XP from all users
        async function deductXpFromAllUsers(amount) {
            const guild = client.guilds.cache.get(guildId);
            const users = await xpDb.collection("users").find({}).toArray();
            for (const user of users) {
                const newXP = Math.max(user.xp - amount, 0);
                await xpDb
                    .collection("users")
                    .updateOne({ userId: user.userId }, { $set: { xp: newXP } });
    
                // Utilize the imported function to handle role updates
                if (config.xpRoles.enabled) {
                    await xpRoles.updateMemberRoles(guildId, user.userId, newXP); 
                }
            }
        }
    }
};
