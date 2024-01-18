const { ActivityType } = require("discord.js");

module.exports = async (client, config) => {
    if (config.enabled === true) {
        const { MongoClient } = require("mongodb");
        const mongoClient = new MongoClient("mongodb://localhost:27017");

        console.log("Discord Streamers module loaded");
        const roleId = config.roleId;
        const announcementChannelId = config.channelId;
        const guild = client.guilds.cache.first(); // Assuming the bot is in one guild
        const role = guild.roles.cache.get(roleId);
        const announcementChannel = await client.channels.fetch(
            announcementChannelId
        );
        
        let db;
        try {
            await mongoClient.connect();
            console.log("Connected to MongoDB for Discord Streamers");
            db = mongoClient.db("twitchMsgDb");
        } catch (error) {
            console.error("Failed to connect to MongoDB:", error);
            return;
        }



        const streamCollection = db.collection("streams"); // Collection for tracking streams

        setInterval(async () => {
            console.log("Checking for streams...");

            try {
                await guild.members.fetch(); // Fetch all members of the guild

                guild.members.cache
                    .filter((member) => member.roles.cache.has(roleId))
                    .forEach(async (member) => {
                        const twitchStream = member.presence?.activities.find(
                            (activity) =>
                                activity.type === ActivityType.Streaming
                        );

                        if (twitchStream) {
                            const existingStream = await streamCollection.findOne(
                                { memberId: member.id }
                            );

                            // If the member is streaming and not already announced
                            if (!existingStream) {
                                const messageContent = `<@&${roleId}>\n**${member.user.tag}** is currently streaming on **${twitchStream.name}** \n\n**Stream Title:** *${twitchStream.details}*\n\nStop by now at ${twitchStream.url} !`;
                                const message = await announcementChannel.send(
                                    messageContent
                                );

                                await streamCollection.insertOne({
                                    memberId: member.id,
                                    messageId: message.id,
                                    streamUrl: twitchStream.url,
                                });
                            }
                        } else {
                            // If the member was streaming but is no longer streaming
                            const existingStream = await streamCollection.findOne(
                                { memberId: member.id }
                            );
                            if (existingStream) {
                                await announcementChannel.messages
                                    .fetch(existingStream.messageId)
                                    .then((message) => {
                                        message.delete(); // Or edit to indicate stream has ended
                                    })
                                    .catch(console.error);

                                await streamCollection.deleteOne({
                                    memberId: member.id,
                                });
                            }
                        }
                    });
            } catch (error) {
                console.error("Error in checking for streamers: ", error);
            }
        }, 30000); // Check every 30 seconds
    }
};
