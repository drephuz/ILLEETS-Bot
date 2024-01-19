const { MongoClient } = require("mongodb");

let client, config, mongoClient;

const setup = async (discordClient, moduleConfig) => {
    client = discordClient;
    config = moduleConfig;
    mongoClient = new MongoClient("mongodb://localhost:27017");

    // Optional: Fetch and cache all channels of the guild
    // Note: Only necessary if you face issues with channel caching
    for (const [guildId, guild] of client.guilds.cache) {
        await guild.channels.fetch().catch(console.error);
    }
};

const updateMemberRoles = async (guildId, memberId, xp) => {

    if (!mongoClient.isConnected) {
        await mongoClient.connect();
    }

    const guild = client.guilds.cache.get(guildId);
    const member = await guild.members.fetch(memberId).catch(console.error);
    if (!member) return;

    // Define role names
    const roleNames = config.roleNames;

    // Determine new role based on XP
    let newRoleName = "";
    if (xp >= 0 && xp <= 5) {
        newRoleName = roleNames[0];
    } else if (xp >= 6 && xp <= 500) {
        newRoleName = roleNames[1];
    } else if (xp >= 501 && xp <= 1499) {
        newRoleName = roleNames[2];
    } else if (xp >= 1500) {
        newRoleName = roleNames[3];
    }

    // Check if member already has the new role
    if (member.roles.cache.some(role => role.name === newRoleName)) {
        return; // Exit if the member already has the new role
    }

    const rolesToRemove = roleNames.filter(role => role !== newRoleName);
    const roleToAdd = guild.roles.cache.find(role => role.name === newRoleName);
    
    if (roleToAdd) {
        await member.roles.add(roleToAdd).catch(console.error);
        await announceRoleChange(guild, member, `you have gained the ${roleToAdd.name} role!`);

        for (const roleName of rolesToRemove) {
            const roleToRemove = guild.roles.cache.find(role => role.name === roleName);
            if (roleToRemove) {
                await member.roles.remove(roleToRemove).catch(console.error);
            }
        }
    }
};

const announceRoleChange = async (guild, member, message) => {
    const announcementChannelId = config.channelId; // Use channel ID in your config
    const channel = guild.channels.cache.get(announcementChannelId);
    if (channel) {
        // Create a mention string for the member
        const mention = `<@${member.id}>`;
        await channel.send(`${mention} - ${message}`);
    } else {
        console.log(`Channel with ID "${announcementChannelId}" not found`);
    }
};

module.exports = {
    setup,
    updateMemberRoles
};
