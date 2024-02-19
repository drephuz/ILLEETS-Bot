// welcomeBot.js
const { MongoClient } = require("mongodb");

module.exports = async (client, config, botConfig) => {
    // Check if the welcome feature is enabled in the configuration
    if (!config.enabled) {
        console.log("Welcome module is disabled.");
        return;
    }

    console.log("Welcome module loaded.");

    // MongoDB connection for XP addition
    let xpDb;
    if (botConfig.xpServer.enabled) {
        const mongoClient = new MongoClient("mongodb://localhost:27017");
        try {
            await mongoClient.connect();
            console.log("Connected to MongoDB for XP System");
            xpDb = mongoClient.db("ServerXpDb");
        } catch (error) {
            console.error("Failed to connect to MongoDB for XP System:", error);
            return;
        }
    }

    client.on("guildMemberAdd", async (member) => {
        // Ensure the member is not a bot
        if (member.user.bot) return;

        // Send a welcome message in the designated channel
        const welcomeChannelId = config.channelId;
        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
        if (welcomeChannel) {
            await welcomeChannel.send(`Welcome, <@${member.id}>! Enjoy your stay.`);
        } else {
            console.log("Welcome channel not found");
        }

        // Add 1 XP for the new member if the XP system is enabled
        if (botConfig.xpServer.enabled) {
            await giveXp(member.id, 1, xpDb);
        }
    });

    async function giveXp(userId, amount, db) {
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ userId: userId });
        const newXP = Math.max((user?.xp || 0) + amount, 0);
        await usersCollection.updateOne(
            { userId: userId },
            { $set: { xp: newXP } },
            { upsert: true }
        );
    }
};
