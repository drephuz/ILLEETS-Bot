const { SlashCommandBuilder } = require("@discordjs/builders");
const { ChannelType } = require("discord.js");

module.exports = (client, config) => {
    if (config.enabled === true) {
        console.log("Dice Roll module loaded");
        const registerCommands = require("./registerCommands");

    const rollCommands = [
        new SlashCommandBuilder()
            .setName("roll")
            .setDescription("Roll a D20 or specify dice options")
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("d")
                    .setDescription("Roll a dice with up to 100 sides")
                    .addIntegerOption((option) =>
                        option
                            .setName("sides")
                            .setDescription("Number of sides for the dice")
                            .setRequired(true)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("modifiers")
                            .setDescription('Modifiers (e.g., "+5 -3")')
                            .setRequired(false)
                    )
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("n")
                    .setDescription(
                        "Roll multiple dice, up to 100 with up to 100 sides"
                    )
                    .addIntegerOption((option) =>
                        option
                            .setName("number")
                            .setDescription("Number of dice to roll")
                            .setRequired(true)
                    )
                    .addIntegerOption((option) =>
                        option
                            .setName("sides")
                            .setDescription("Number of sides for each dice")
                            .setRequired(true)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("modifiers")
                            .setDescription('Modifiers (e.g., "+5 -3")')
                            .setRequired(false)
                    )
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("advantage")
                    .setDescription("Roll 2xD20s, and take the better result")
                    .addStringOption((option) =>
                        option
                            .setName("modifiers")
                            .setDescription('Modifiers (e.g., "+5 -3")')
                            .setRequired(false)
                    )
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("disadvantage")
                    .setDescription("Roll 2xD20s, and take the worst result")
                    .addStringOption((option) =>
                        option
                            .setName("modifiers")
                            .setDescription('Modifiers (e.g., "+5 -3")')
                            .setRequired(false)
                    )
            )
            .toJSON(),
    ];

    registerCommands.addCommands(rollCommands);

    client.guilds.cache.forEach(guild => {
        guild.channels.fetch(); // Cache all channels
    });

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isCommand() || interaction.commandName !== "roll") return;
    
        const restrictedChannelId = config.channelId;
    
        if (restrictedChannelId) {
            const restrictedChannel = await interaction.guild.channels.fetch(restrictedChannelId).catch(console.error);
    
            // Check if the channel exists and is accessible
            if (!restrictedChannel) {
                await interaction.reply({ content: "The configured channel for dice rolls is not accessible or does not exist.", ephemeral: true });
                return;
            }
    
            // Check if the interaction is not in the restricted channel
            if (interaction.channelId !== restrictedChannelId) {
                let response = `Sorry, dice rolls are only allowed in `;
    
                if (restrictedChannel.type === ChannelType.GuildText) { // Check if the channel is a text channel
                    response += `the <#${restrictedChannelId}> channel.`;
                } else if (restrictedChannel.type === ChannelType.GuildCategory) { // Check if the channel is a category
                    const textChannels = restrictedChannel.children.filter(c => c.type === ChannelType.GuildText);
                    if (textChannels.size > 0) {
                        response += `one of the text channels under the ${restrictedChannel.name} category, like <#${textChannels.first().id}>.`;
                    } else {
                        response += `a text channel under the ${restrictedChannel.name} category.`;
                    }
                } else {
                    response += `the configured channel. Please check with the server administrators.`;
                }
    
                await interaction.reply({ content: response, ephemeral: true });
                return;
            }
        }
    
        const subcommand = interaction.options.getSubcommand(false);
        let numDice = 1,
            diceSides = 20,
            rolls = [],
            totalRoll = 0,
            resultText = "";
        let modifiers =
            interaction.options.getString("modifiers")?.split(" ") || [];
    
        switch (subcommand) {
            case "d":
                diceSides = interaction.options.getInteger("sides");
                rolls.push(rollDice(diceSides));
                resultText = `You rolled a D${diceSides}: `;
                break;
            case "n":
                numDice = interaction.options.getInteger("number");
                diceSides = interaction.options.getInteger("sides");
                for (let i = 0; i < numDice; i++) {
                    rolls.push(rollDice(diceSides));
                }
                resultText = `You rolled ${numDice} D${diceSides}'s: `;
                break;
            case "advantage":
                rolls.push(rollDice(20), rollDice(20));
                resultText = `You rolled 2 D20's with advantage: `;
                rolls = [Math.max(...rolls)];
                break;
            case "disadvantage":
                rolls.push(rollDice(20), rollDice(20));
                resultText = `You rolled 2 D20's with disadvantage: `;
                rolls = [Math.min(...rolls)];
                break;
        }
    
        // Process rolls and modifiers
        totalRoll = rolls.reduce((acc, roll) => acc + roll, 0);
        let modifierTotal = processModifiers(modifiers);
        if (modifierTotal === 501) {
            await interaction.reply(
                "Modifiers cannot be greater or less than **100**"
            );
            return;
        }
        if (modifiers.length > 0 && modifierTotal !== 0) {
            resultText += `${rolls.join(" + ")}\nModifier(s): ${modifiers.join(" ")} = ${modifierTotal}\nTotal Result: ${totalRoll}`;
        } else {
            resultText += `${rolls.join(" + ")}\nTotal Result: ${totalRoll}`;
        }
    
        await interaction.reply(resultText);
    });

    // Rest of your helper functions...

    function rollDice(sides) {
        return Math.ceil(Math.random() * sides);
    }

    function formatRollResults(rolls, numDice, diceSides, totalRoll) {
        let resultText = "";
        if (numDice === 1) {
            resultText += formatRollResult(rolls[0], diceSides);
        } else {
            resultText += `Rolled ${numDice} x D${diceSides}'s: ${rolls.join(
                " + "
            )}\nTotal Roll: ${totalRoll}\n`;
        }
        return resultText;
    }

    function formatRollResult(roll, sides) {
        let resultText =
            roll === sides
                ? "***Critical Success***\n"
                : roll === 1
                ? "***Critical Failure***\n"
                : "";
        resultText += `Rolled a D${sides}: ${roll}\n`;
        return resultText;
    }

    function processModifiers(modifiers) {
        let totalModifier = 0;
        for (let i = 0; i < modifiers.length; i++) {
            if (modifiers[i] === "-" || modifiers[i] === "+") {
                let cleanedMod =
                    modifiers[i + 1] * (modifiers[i] === "-" ? -1 : 1);
                let modValue = parseInt(cleanedMod, 10);
                if (!isNaN(modValue)) {
                    if (modValue > 100 || modValue < -100) {
                        totalModifier = 501; //my own dumb error code I use in the message reply check area.
                        break;
                    }
                    totalModifier += modValue;
                }
                i++; // Skip the next element as it's already processed
            }
        }
        return totalModifier;
    }

    function capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    // Additional utility functions (formatRollResults, processModifiers, etc.) from your second script
};
}
