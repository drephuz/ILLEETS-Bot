module.exports = async (client, config) => {
    // Check if Enabled, otherwise ignore module
    if (config.enabled === true) {
        // Confirm Reaction Roles module loaded
        console.log("Reaction Roles module loaded");

        // Existing logic for reaction roles
        const channelId = config.channelId;
        const channel = await client.channels.fetch(channelId);
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

        // Getting the specific message from the cache to be used for reactions
        const messageToReact = messages.get(specificMessageId);
        if (messageToReact) {
            for (const emoji of reactionEmojis) {
                await messageToReact.react(emoji);
            }
        } else {
            console.log("Message to react not found in the cached messages.");
        }

        // Additional variables for rules agreement
        const rulesMessageId = config.rulesMessageId;
        // Skip rules logic if rulesMessageId is not provided
        if (rulesMessageId) {
            const rulesChannelId = config.rulesChannelId || channelId;
            const rulesEmoji = config.rulesEmoji;
            const rulesRoleId = config.rulesRoleId;

            const rulesChannel = await client.channels.fetch(rulesChannelId);
            const rulesMessages = await rulesChannel.messages.fetch({ limit: 100 });
            const rulesMessageToReact = rulesMessages.get(rulesMessageId);

            if (rulesMessageToReact) {
                await rulesMessageToReact.react(rulesEmoji);
            } else {
                console.log("Rules message to react not found in the cached messages.");
            }

            // Reaction add event for rules agreement
            client.on("messageReactionAdd", async (reaction, user) => {
                if (reaction.message.id !== rulesMessageId) return;

                if (reaction.emoji.name === rulesEmoji) {
                    const role = reaction.message.guild.roles.cache.get(rulesRoleId);
                    if (!role) {
                        console.log(`Rules role not found`);
                        return;
                    }

                    const member = await reaction.message.guild.members.fetch(user.id);
                    member.roles.add(role).catch(console.error);
                    console.log(`Rules role added to user ${user.tag}`);
                }
            });

            // Reaction remove event for rules agreement
            client.on("messageReactionRemove", async (reaction, user) => {
                if (reaction.message.id !== rulesMessageId) return;

                if (reaction.emoji.name === rulesEmoji) {
                    const role = reaction.message.guild.roles.cache.get(rulesRoleId);
                    if (!role) {
                        console.log(`Rules role not found`);
                        return;
                    }

                    const member = await reaction.message.guild.members.fetch(user.id);
                    member.roles.remove(role).catch(console.error);
                    console.log(`Rules role removed from user ${user.tag}`);
                }
            });
        }
    }
};