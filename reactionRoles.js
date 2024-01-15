module.exports = async (client, config) => {
    if(config.enabled === true){
        console.log("Reaction Roles module loaded");
        const channelId = config.channelId;
        const channel = await client.channels.fetch(channelId); 
        const messages = await channel.messages.fetch({ limit: 100 });
        const specificMessageId = config.messageId;
        const reactionEmoji1 = config.reactionEmojis[0];
        const roleName1 = config.roleNames[0];
        const reactionEmoji2 = config.reactionEmojis[1];
        const roleName2 = config.roleNames[1];
        const reactionEmojis = config.reactionEmojis;
    
        const messageToReact = messages.get(specificMessageId);
        if (messageToReact) {
            for (const emoji of reactionEmojis) {
                await messageToReact.react(emoji);
            }
        } else {
            console.log('Message to react not found in the cached messages.');
        }
    
        client.on('messageReactionAdd', async (reaction, user) => {
        //Handle Role 1 Add
        if (reaction.message.id === specificMessageId && reaction.emoji.name === reactionEmoji1) {
            const role = reaction.message.guild.roles.cache.find(r => r.name === roleName1);
            if (!role) {
                console.log(`Role "${roleName1}" not found`);
                return;
            }
    
            const member = await reaction.message.guild.members.fetch(user.id);
            member.roles.add(role).catch(console.error);
            console.log(`Role "${roleName1}" added to user ${user.tag}`);
        }
        //Handle Role 2 Add
        if (reaction.message.id === specificMessageId && reaction.emoji.name === reactionEmoji2) {
            const role = reaction.message.guild.roles.cache.find(r => r.name === roleName2);
            if (!role) {
                console.log(`Role "${roleName2}" not found`);
                return;
            }
    
            const member = await reaction.message.guild.members.fetch(user.id);
            member.roles.add(role).catch(console.error);
            console.log(`Role "${roleName2}" added to user ${user.tag}`);
        }
        });
    
        client.on('messageReactionRemove', async (reaction, user) => {
        //Handle Role 1 Remove
        if (reaction.message.id === specificMessageId && reaction.emoji.name === reactionEmoji1) {
            const role = reaction.message.guild.roles.cache.find(r => r.name === roleName1);
            if (!role) {
                console.log(`Role "${roleName1}" not found`);
                return;
            }
    
            const member = await reaction.message.guild.members.fetch(user.id);
            member.roles.remove(role).catch(console.error);
            console.log(`Role "${roleName1}" removed from user ${user.tag}`);
        }
        //Handle Role 2 Remove
        if (reaction.message.id === specificMessageId && reaction.emoji.name === reactionEmoji2) {
            const role = reaction.message.guild.roles.cache.find(r => r.name === roleName2);
            if (!role) {
                console.log(`Role "${roleName2}" not found`);
                return;
            }
    
            const member = await reaction.message.guild.members.fetch(user.id);
            member.roles.remove(role).catch(console.error);
            console.log(`Role "${roleName2}" removed from user ${user.tag}`);
        }
        });
    }

};
