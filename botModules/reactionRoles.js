module.exports = async (client, config) => {
    // Check if Enabled, otherwise ignore module
    if (config.enabled === true) {
        console.log("Reaction Roles module loaded");

        // Logic for reaction roles
        const channelId = config.channelId;
        const channel = await client.channels.fetch(channelId);
        const messages = await channel.messages.fetch({ limit: 100 });
        const specificMessageId = config.messageId;
        const roleNames = config.roleNames;
        const reactionEmojis = config.reactionEmojis;

        if (roleNames.length !== reactionEmojis.length) {
            throw new Error(`Invalid configuration: the number of roles does not match the number of emojis.`);
        }

        const messageToReact = messages.get(specificMessageId);
        if (messageToReact) {
            for (const emoji of reactionEmojis) {
                await messageToReact.react(emoji);
            }
        } else {
            console.log("Message to react not found in the cached messages.");
        }

        client.on("messageReactionAdd", async (reaction, user) => {
            if (reaction.message.id !== specificMessageId) return;

            reactionEmojis.forEach(async (emoji, index) => {
                if (reaction.emoji.name === emoji) {
                    const roleName = roleNames[index];
                    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
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

        client.on("messageReactionRemove", async (reaction, user) => {
            if (reaction.message.id !== specificMessageId) return;

            reactionEmojis.forEach(async (emoji, index) => {
                if (reaction.emoji.name === emoji) {
                    const roleName = roleNames[index];
                    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
                    if (!role) {
                        console.log(`Role "${roleName}" not found`);
                        return;
                    }

                    const member = await reaction.message.guild.members.fetch(user.id);
                    member.roles.remove(role).catch(console.error);
                    console.log(`Role "${roleName}" removed from user ${user.tag}`);
                }
            });
        });

        // Check if rules configuration is provided
        if (config.rulesChannelId && config.rulesMessageId && config.rulesEmoji && config.rulesRoleId) {
            const rulesChannel = await client.channels.fetch(config.rulesChannelId);
            const rulesMessages = await rulesChannel.messages.fetch({ limit: 100 });
            const rulesMessageToReact = rulesMessages.get(config.rulesMessageId);

            if (rulesMessageToReact) {
                await rulesMessageToReact.react(config.rulesEmoji);
            } else {
                console.log("Rules message to react not found in the cached messages.");
            }

            client.on("messageReactionAdd", async (reaction, user) => {
                if (reaction.message.id !== config.rulesMessageId) return;

                if (reaction.emoji.name === config.rulesEmoji) {
                    const role = reaction.message.guild.roles.cache.get(config.rulesRoleId);
                    if (!role) {
                        console.log(`Rules role not found`);
                        return;
                    }

                    const member = await reaction.message.guild.members.fetch(user.id);
                    member.roles.add(role).catch(console.error);
                    console.log(`Rules role added to user ${user.tag}`);
                }
            });

            client.on("messageReactionRemove", async (reaction, user) => {
                if (reaction.message.id !== config.rulesMessageId) return;

                if (reaction.emoji.name === config.rulesEmoji) {
                    const role = reaction.message.guild.roles.cache.get(config.rulesRoleId);
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
