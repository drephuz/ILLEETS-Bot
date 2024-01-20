const OpenAI = require("openai");
const MAX_WORDS_PER_MESSAGE = 200; // Maximum words per message

module.exports = async (client, config) => {
    if (config.enabled === true) {
        console.log("ChatGPT Response module loaded");

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: config.openAIKey,
        });

        // Discord client setup
        const guild = client.guilds.cache.first(); // Assuming the bot is in one guild
        const channelId = config.channelId; // ID of the channel for ChatGPT interactions
        const channel = await client.channels.fetch(channelId);

        // Listen for messages
        client.on("messageCreate", async (message) => {
            if (message.author.bot) return;
            if (message.channel.id !== channelId) return;
            if (!message.mentions.has(client.user.id)) return;

            try {
                const botMember = guild.members.cache.get(client.user.id);
                const botNickname = botMember ? botMember.displayName : client.user.username;
                const personality = config.personality ? `Personality: ${config.personality}. ` : "";
                let promptMessage = `${personality}${message.content}`;
                promptMessage = promptMessage.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), botNickname);
                
                const gptResponse = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [{
                        "role": "user",
                        "content": promptMessage
                    }],
                    max_tokens: 150,
                });

                if (gptResponse.choices && gptResponse.choices.length > 0) {
                    let responseContent = gptResponse.choices[0].message.content;
                    responseContent = responseContent.replace(/\bAI\b/gi, "UberHuman");
                    responseContent = responseContent.replace(/language model/gi, "set of random code and logic");

                    // Split and send long responses in multiple messages
                    const words = responseContent.split(' ');
                    while (words.length > 0) {
                        const messageWords = words.splice(0, MAX_WORDS_PER_MESSAGE);
                        const responseMessage = messageWords.join(' ');
                        if (responseMessage) {
                            await channel.send(responseMessage);
                        }
                    }
                }
            } catch (error) {
                console.error("Error with OpenAI response: ", error);
            }
        });
    }
};
