const { ActivityType } = require("discord.js");

module.exports = async (client, config) => {
    if (config.enabled === true) {
        const { MongoClient } = require("mongodb");
        const mongoClient = new MongoClient("mongodb://localhost:27017");

        console.log("Discord Streamers module loaded");
        const roleId = config.roleId;
        const specialRoleId = config.specialRoleId;
        const modRoleId = config.modRoleId; // New role ID for mods
        const inactiveRoleId = config.inactiveRoleId;
        const announcementChannelId = config.channelId;
        const specialAnnouncementChannelId = config.specialChannelId;
        const modAnnouncementChannelId = config.modChannelId; // New channel ID for mod shoutouts
        const guild = client.guilds.cache.first();
        const announcementChannel = await client.channels.fetch(announcementChannelId);
        const specialAnnouncementChannel = specialRoleId ? await client.channels.fetch(specialAnnouncementChannelId) : null;
        const modAnnouncementChannel = modRoleId ? await client.channels.fetch(modAnnouncementChannelId) : null; // Fetch channel for mod shoutouts

        let db;
        try {
            await mongoClient.connect();
            console.log("Connected to MongoDB for Discord Streamers");
            db = mongoClient.db("twitchMsgDb");
        } catch (error) {
            console.error("Failed to connect to MongoDB:", error);
            return;
        }

        const streamCollection = db.collection("streams");

        setInterval(async () => {
            try {
                await guild.members.fetch();
        
                guild.members.cache
                    .filter((member) => member.roles.cache.has(roleId) || (modRoleId && member.roles.cache.has(modRoleId)))
                    .forEach(async (member) => {
                        if (inactiveRoleId && member.roles.cache.has(inactiveRoleId)) {
                            return;
                        }

                        const twitchStream = member.presence?.activities.find(
                            (activity) => activity.type === ActivityType.Streaming
                        );

                        if (twitchStream) {
                            const existingStream = await streamCollection.findOne({ memberId: member.id });

                            if (!existingStream) {
                                const baseMessageContent = `<@&${roleId}>\n**${member.user.tag}** is currently streaming on **${twitchStream.name}** \n\n *${twitchStream.details}*\n\nStop by now at ${twitchStream.url} !`;

                                let targetChannel;
                                let shoutoutType = '';

                                if (modRoleId && member.roles.cache.has(modRoleId) && modAnnouncementChannel) {
                                    targetChannel = modAnnouncementChannel;
                                    shoutoutType = 'mod';
                                } else if (specialRoleId && member.roles.cache.has(specialRoleId) && specialAnnouncementChannel) {
                                    targetChannel = specialAnnouncementChannel;
                                    shoutoutType = 'special';
                                } else {
                                    targetChannel = announcementChannel;
                                }

                                // Send the shoutout message based on type
                                let sentMessage;
                                if (shoutoutType === 'mod') {
                                    sentMessage = await targetChannel.send(`🔧 Mod Streamer Alert! 🔧\n${baseMessageContent}`);
                                } else if (shoutoutType === 'special') {
                                    sentMessage = await targetChannel.send(`🌟 Featured Streamer Alert! 🌟\n${baseMessageContent}`);
                                } else {
                                    sentMessage = await targetChannel.send(baseMessageContent);
                                }

                                await streamCollection.insertOne({
                                    memberId: member.id,
                                    messageId: sentMessage.id,
                                    streamUrl: twitchStream.url,
                                    shoutoutType: shoutoutType
                                });
                            }

                        } else {
                            const existingStream = await streamCollection.findOne({ memberId: member.id });
                            if (existingStream) {
                                let channel;
                                if (existingStream.shoutoutType === 'mod' && modAnnouncementChannel) {
                                    channel = modAnnouncementChannel;
                                } else if (existingStream.shoutoutType === 'special' && specialAnnouncementChannel) {
                                    channel = specialAnnouncementChannel;
                                } else {
                                    channel = announcementChannel;
                                }
        
                                channel.messages
                                    .fetch(existingStream.messageId)
                                    .then((message) => {
                                        message.delete();
                                    })
                                    .catch(console.error);
        
                                await streamCollection.deleteOne({ memberId: member.id });
                            }
                        }
                    });
            } catch (error) {
                console.error("Error in checking for streamers: ", error);
            }
        }, 30000); // Check every 30 seconds
    }
};
