module.exports = async (client, config) => {
    if (config.xpRoles.enabled) {
        const { MongoClient } = require("mongodb");
        const mongoClient = new MongoClient("mongodb://localhost:27017");
        console.log("XP Role Management module loaded");

        const guild = client.guilds.cache.get(config.bot.guildId); // Assuming the bot is in one guild
        const xpDb = await mongoClient.connect().then(client => client.db("ServerXpDb"));

        client.on('messageCreate', async message => {
            if (message.author.bot) return; // Ignore bot messages

            const member = guild.members.cache.get(message.author.id);
            const userData = await xpDb.collection("users").findOne({ userId: member.id });
            const xp = userData ? userData.xp : 0;

            let newRoleName = '';
            let roleChangeMessage = '';
            let roles = ['Inactive', 'Active', 'Very Chatty', 'Living Here'];

            if (xp >= 0 && xp <= 5 && !member.roles.cache.some(role => role.name === "Inactive")) {
                newRoleName = "Inactive";
                roleChangeMessage = `Awww, we miss you ${member.displayName}, you've been marked as Inactive.`;
            } else if (xp >= 6 && xp <= 500 && !member.roles.cache.some(role => role.name === "Active")) {
                newRoleName = "Active";
                roleChangeMessage = `Congratulations! You've acquired the Active role, ${member.displayName}!`;
            } else if (xp >= 501 && xp <= 1499 && !member.roles.cache.some(role => role.name === "Very Chatty")) {
                newRoleName = "Very Chatty";
                roleChangeMessage = `Wow, ${member.displayName}, you're Very Chatty! Enjoy your new role!`;
            } else if (xp >= 1500 && !member.roles.cache.some(role => role.name === "Living Here")) {
                newRoleName = "Living Here";
                roleChangeMessage = `Incredible, ${member.displayName}! You've been so active that you now 'Live Here'!`;
            }

            if (newRoleName) {
                const role = guild.roles.cache.find(role => role.name === newRoleName);
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
        });
    }
};
