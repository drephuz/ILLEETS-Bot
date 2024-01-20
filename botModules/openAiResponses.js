const OpenAI = require("openai");
const AVERAGE_WORD_LENGTH = 4.7; // Average English word length including spaces
const MAX_WORDS_PER_MESSAGE = 200; // Target maximum words per message
const MAX_MESSAGE_LENGTH = 2000; // Maximum characters per message

// Define an array of the top 50 scripting languages
const scriptLanguages = [
    "JavaScript", "Python", "Ruby", "PHP", "Perl",
    "Lua", "Bash", "Shell", "PowerShell", "TypeScript",
    "html", "css", "c#", "js", "story", "script", "code"
];

module.exports = async (client, config) => {
    if (config.enabled === true) {
        console.log("ChatGPT Response module loaded");

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: config.openAIKey,
        });

        // Discord client setup
        const guild = client.guilds.cache.first(); 
        const channelId = config.channelId; 
        const channel = await client.channels.fetch(channelId);

        // Listen for messages
        client.on("messageCreate", async (message) => {
            if (message.author.bot) return;
            if (message.channel.id !== channelId) return;
            if (!message.mentions.has(client.user.id)) return;

            const userMessage = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();

            // Check for "generate" and any scripting language
            if (userMessage.includes("generate") || userMessage.includes("make") && scriptLanguages.some(lang => userMessage.includes(lang))) {
                // Send a random "No" GIF
                const noGif = await findNoGif(); // Implement findNoGif to get a random "No" GIF
                await channel.send({ files: [noGif] });
                return;
            }

            // Check if the user message contains at least 2 words
            if (userMessage.split(/\s+/).length < 2) {
                await channel.send("I need more than that to work with...");
                return;
            }

            try {
                const botMember = guild.members.cache.get(client.user.id);
                const botNickname = botMember ? botMember.displayName : client.user.username;
                const personality = config.personality ? `Personality: ${config.personality}. ` : "";
                let promptMessage = `${personality}${userMessage}`;

                // Calculate max_tokens for an average of 200 words per message
                const max_tokens = Math.round((MAX_WORDS_PER_MESSAGE * AVERAGE_WORD_LENGTH) / 4.7); 

                const gptResponse = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [{
                        "role": "user",
                        "content": promptMessage
                    }],
                    max_tokens: max_tokens,
                });

                if (gptResponse.choices && gptResponse.choices.length > 0) {
                    let responseContent = gptResponse.choices[0].message.content;
                    responseContent = responseContent.replace(/\bAI\b/gi, "UberHuman");
                    responseContent = responseContent.replace(/language model/gi, "set of random code and logic");

                    // Ensure the response does not exceed 2000 characters
                    if (responseContent.length > MAX_MESSAGE_LENGTH) {
                        responseContent = responseContent.substring(0, MAX_MESSAGE_LENGTH);
                    }

                    // Send the response in one message
                    if (responseContent) {
                        await channel.send(responseContent);
                    }
                }
            } catch (error) {
                console.error("Error with OpenAI response: ", error);
            }
        });
    }
};

async function findNoGif() {
    // Implementation to fetch and return a random "No" GIF URL
    // This could use Discord's image search or any other GIF service API
    return 'https://media.tenor.com/1BTOV40oG_0AAAAM/pernalonga-meme-pernalonga-no.gif';
}
