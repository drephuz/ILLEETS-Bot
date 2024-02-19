const { MongoClient } = require("mongodb");

// MongoDB setup
const dbUri = "mongodb://localhost:27017";
const collectionName = "userXP"; // MongoDB collection for tracking user XP and 0 XP duration

let client, config, mongoClient;

const setup = async (discordClient, moduleConfig) => {
    client = discordClient;
    config = moduleConfig;
    mongoClient = new MongoClient(dbUri);
    try {
        await mongoClient.connect();
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
    }
};

const updateMemberRoles = async (guildId, memberId, xp) => {
    const db = mongoClient.db(); // Assuming db is selected elsewhere or default is used
    const collection = db.collection(collectionName);

    const guild = client.guilds.cache.get(guildId);
    const member = await guild.members.fetch(memberId).catch(console.error);
    if (!member) return;

    const roleNames = config.roleNames;
    const xpThresholds = [0, 1, 501, 1500]; // Adjusted for new tier system

    // Retrieve or initialize user's XP data
    let userXP = await collection.findOne({ memberId: memberId });
    if (!userXP) {
        userXP = {
            memberId: memberId,
            xp: xp,
            dateReached0XP: null
        };
        await collection.insertOne(userXP);
    } else {
        // Update XP and check for 0 XP condition
        if (xp === 0 && (!userXP.dateReached0XP || userXP.xp > 0)) {
            userXP.dateReached0XP = new Date(); // Set to current date if just reached 0 XP
        } else if (xp > 0) {
            userXP.dateReached0XP = null; // Reset if XP is gained
        }
        userXP.xp = xp;
        await collection.updateOne({ memberId: memberId }, { $set: userXP });
    }

    let newRoleName = "";
    let currentXPTier = getCurrentXPTier(member, roleNames, xpThresholds);
    let newXPTier = getNewXPTier(xp, xpThresholds);

    if (newXPTier <= currentXPTier) {
        return; // No role update if not a promotion or if demotion
    }

    newRoleName = roleNames[newXPTier];

    if (newXPTier === 0 && !await isEligibleForLowestTier(userXP)) {
        return; // Member not eligible for Lowest Tier yet
    }

    const rolesToRemove = roleNames.filter((_, index) => index !== newXPTier);
    const roleToAdd = guild.roles.cache.find(role => role.name === newRoleName);
    
    if (roleToAdd) {
        await member.roles.add(roleToAdd).catch(console.error);
        if (newXPTier > 0) {
            await announceRoleChange(guild, member, `you have gained the ${roleToAdd.name} role!`);
        }
        for (const roleName of rolesToRemove) {
            const roleToRemove = guild.roles.cache.find(role => role.name === roleName);
            if (roleToRemove) {
                await member.roles.remove(roleToRemove).catch(console.error);
            }
        }
    }
};

async function isEligibleForLowestTier(userXP) {
    if (!userXP.dateReached0XP) return false;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(userXP.dateReached0XP) <= sevenDaysAgo;
}

function getCurrentXPTier(member, roleNames, xpThresholds) {
    let tier = -1;
    member.roles.cache.forEach(role => {
        const index = roleNames.indexOf(role.name);
        if (index !== -1) {
            tier = Math.max(tier, index);
        }
    });
    return tier;
}

function getNewXPTier(xp, xpThresholds) {
    for (let i = xpThresholds.length - 1; i >= 0; i--) {
        if (xp >= xpThresholds[i]) return i;
    }
    return -1; // Should not happen
}

const announceRoleChange = async (guild, member, message) => {
    const announcementChannelId = config.channelId;
    const channel = guild.channels.cache.get(announcementChannelId);
    if (channel) {
        const mention = `<@${member.id}>`;
        await channel.send(`${mention} - ${message}`);
    } else {
        console.error(`Channel with ID "${announcementChannelId}" not found`);
    }
};

module.exports = {
    setup,
    updateMemberRoles
};
