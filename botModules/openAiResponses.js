const OpenAI = require("openai");

// Define an array of the top 50 scripting languages
const scriptLanguages = [
    "javascript", "python", "ruby", "php", "perl",
    "lua", "bash", "shell", "powershell", "typescript",
    "html", "css", "c#", "js", "story", "script", "code"
].map(lang => lang.toLowerCase());

const triggerTerms = ["generate", "make", "create", "build", "compose", "formulate"]
    .map(term => term.toLowerCase());

module.exports = async (client, config) => {
    if (config.enabled === true) {
        console.log("ChatGPT Response module loaded");

        const openai = new OpenAI({
            apiKey: config.openAIKey,
        });

        const guild = client.guilds.cache.first(); 
        const channelId = config.channelId; 
        const channel = await client.channels.fetch(channelId);

        client.on("messageCreate", async (message) => {
            if (message.author.bot) return;
            if (message.channel.id.toLowerCase() !== channelId) return;
            if (!message.mentions.has(client.user.id)) return;

            const userMessage = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim().toLowerCase();

            if (triggerTerms.some(term => userMessage.includes(term)) && scriptLanguages.some(lang => userMessage.includes(lang))) {
                const noGif = await findNoGif();
                await channel.send({ files: [noGif] });
                return;
            }

            if (userMessage.split(/\s+/).length < 2) {
                await channel.send("I need more than that to work with...");
                return;
            }

            try {
                const personality = config.personality ? `Personality: ${config.personality}. ` : "";
                let promptMessage = `Give a summarized ${personality}response to this request, and remember to never admit you are AI:\n\n${userMessage}`;

                // Indicate the bot is typing while waiting for a response
                await channel.sendTyping();

                const gptResponse = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [{
                        "role": "user",
                        "content": promptMessage
                    }],
                    temperature: 0.7
                });

                if (gptResponse.choices && gptResponse.choices.length > 0) {
                    let responseContent = gptResponse.choices[0].message.content;

                    const responseChunks = splitIntoChunks(responseContent, 2000);
                    for (let i = 0; i < responseChunks.length; i++) {
                        if (i === 0) {
                            await message.reply(responseChunks[i]);
                        } else {
                            await channel.send(responseChunks[i]);
                        }
                    }
                }
            } catch (error) {
                console.error("Error with OpenAI response: ", error);
            }
        });
    }
};

async function findNoGif() {
    return 'https://media.tenor.com/1BTOV40oG_0AAAAM/pernalonga-meme-pernalonga-no.gif';
}

function splitIntoChunks(str, maxSize) {
    const chunks = [];
    for (let i = 0; i < str.length; i += maxSize) {
        chunks.push(str.substring(i, i + maxSize));
    }
    return chunks;
}
