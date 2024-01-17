module.exports = async (client, config) => {
    //check if Enabled, otherwise ignore module
    if (config.enabled === true) {
        //confirm Reaction Roles module loaded
        console.log("Reaction Roles module loaded");
        const channelId = config.channelId;
        //get the channel based on the channel Id specified in the config
        const channel = await client.channels.fetch(channelId);
        //cache 100 messages back in that channel.  Used for future expansion for multiple messages
        const messages = await channel.messages.fetch({ limit: 100 });
        const specificMessageId = config.messageId;
        const roleNames = config.roleNames;
        const reactionEmojis = config.reactionEmojis;

        // Ensuring the count of emojis matches the count of roles
        if (roleNames.length !== reactionEmojis.length) {
            throw new Error(
                `Invalid configuration: the number of roles does not match the number of emojis.`
            );
        }

        //getting the specific message from the cache to be used for reactions.  Message ID does not change if message is edited.
        const messageToReact = messages.get(specificMessageId);
        //one message is matched from messageId and found, react with all available emojis in reactionEmojis[]. This makes it so permissions can be added to the channel for users to not add their own emoji's, but only react using existing.
        if (messageToReact) {
            for (const emoji of reactionEmojis) {
                await messageToReact.react(emoji);
            }
        } else {
            console.log("Message to react not found in the cached messages.");
        }

        //when a user adds an emoji to the message, cycle through all emoji's in the reactionEmojis[] array for a match.  Use reactionEmoji[index] to assign appropriate roleName[index]
        client.on("messageReactionAdd", async (reaction, user) => {
            if (reaction.message.id !== specificMessageId) return;

            reactionEmojis.forEach(async (emoji, index) => {
                if (reaction.emoji.name === emoji) {
                    const roleName = roleNames[index];
                    const role = reaction.message.guild.roles.cache.find(
                        (r) => r.name === roleName
                    );
                    if (!role) {
                        console.log(`Role "${roleName}" not found`);
                        return;
                    }

                    const member = await reaction.message.guild.members.fetch(user.id);
                    member.roles.add(role).catch(console.error);
                    console.log(`Role "${roleName}" added to user ${user.tag}`);
                }
            });
        });

        //same for action above, but in reverse.
        client.on("messageReactionRemove", async (reaction, user) => {
            if (reaction.message.id !== specificMessageId) return;

            reactionEmojis.forEach(async (emoji, index) => {
                if (reaction.emoji.name === emoji) {
                    const roleName = roleNames[index];
                    const role = reaction.message.guild.roles.cache.find(
                        (r) => r.name === roleName
                    );
                    if (!role) {
                        console.log(`Role "${roleName}" not found`);
                        return;
                    }

                    const member = await reaction.message.guild.members.fetch(
                        user.id
                    );
                    member.roles.remove(role).catch(console.error);
                    console.log(
                        `Role "${roleName}" removed from user ${user.tag}`
                    );
                }
            });
        });
    }
};
