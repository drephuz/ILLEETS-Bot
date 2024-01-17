module.exports = (client, config) => {
    console.log("Example Command module loaded");
    const { SlashCommandBuilder } = require('@discordjs/builders');
    const { REST } = require('@discordjs/rest');
    const { Routes } = require('discord-api-types/v10');

    const clientId = config.bot.applicationId; // Your bot's client ID
    const guildId = config.bot.guildId; // Your guild's ID
    const token = config.bot.token;

    const commands = [
        new SlashCommandBuilder()
            .setName('roll')
            .setDescription('Roll some dice')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('d20')
                    .setDescription('Roll a D20')
                    .addStringOption(option =>
                        option.setName('modifiers')
                            .setDescription('Modifiers (e.g., "+5 -3")')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('d')
                    .setDescription('Roll a dice with up to 100 sides')
                    .addIntegerOption(option =>
                        option.setName('sides')
                            .setDescription('Number of sides for the dice')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('modifiers')
                            .setDescription('Modifiers (e.g., "+5 -3")')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('n')
                    .setDescription('Roll multiple dice, up to 100 with up to 100 sides')
                    .addIntegerOption(option =>
                        option.setName('number')
                            .setDescription('Number of dice to roll')
                            .setRequired(true))
                    .addIntegerOption(option =>
                        option.setName('sides')
                            .setDescription('Number of sides for each dice')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('modifiers')
                            .setDescription('Modifiers (e.g., "+5 -3")')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('advantage')
                    .setDescription('Roll 2xD20s, and take the better result')
                    .addStringOption(option =>
                        option.setName('modifiers')
                            .setDescription('Modifiers (e.g., "+5 -3")')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('disadvantage')
                    .setDescription('Roll 2xD20s, and take the worst result')
                    .addStringOption(option =>
                        option.setName('modifiers')
                            .setDescription('Modifiers (e.g., "+5 -3")')
                            .setRequired(false)))
            .toJSON()
    ];
    

    const rest = new REST({ version: '10' }).setToken(token);

    // Registering the command to the guild
    rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);

        client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;
        
            const commandName = interaction.commandName;
        
            if (commandName === 'roll') {
                const subcommand = interaction.options.getSubcommand();
        
                let numDice = 1, diceSides = 20, rollType = 'normal', rolls = [], totalRoll = 0, resultText = "";
                let modifiers = interaction.options.getString('modifiers')?.split(' ') || [];
        
                switch (subcommand) {
                    case 'd20':
                        rolls.push(rollDice(20));
                        break;
                    case 'd':
                        diceSides = interaction.options.getInteger('sides');
                        rolls.push(rollDice(diceSides));
                        break;
                    case 'n':
                        numDice = interaction.options.getInteger('number');
                        diceSides = interaction.options.getInteger('sides');
                        for (let i = 0; i < numDice; i++) {
                            rolls.push(rollDice(diceSides));
                        }
                        break;
                    case 'advantage':
                    case 'disadvantage':
                        rollType = subcommand;
                        rolls.push(rollDice(20), rollDice(20));
                        break;
                }
        
                // Process the rolls based on rollType
                //if not normal, check for advantage or disadvantage to determine if "Critical Success" text should be considered.  If it is a disadvantage, and one of the rolls is a crit success, "Criticall Success" should not be declared
                if (rollType !== "normal") {
                    let chosenRoll =
                        rollType === "advantage"
                            ? Math.max(...rolls)
                            : Math.min(...rolls);
                    resultText += `Rolled with ${rollType}: (${rolls.join(", ")})\n`;
                    if (rollType === "advantage" && rolls.includes(diceSides)) {
                        resultText += "***Critical Success***\n";
                    }
                    resultText += `${capitalize(rollType)}: ${chosenRoll}\n`;
                    totalRoll = chosenRoll;
                } else {
                    //if there are more than 100 dice or 100 sides per dice, it will throw an error
                    if (diceSides > 100 || numDice > 100) {
                        message.reply(
                            "No more than **100 dice** *or* **100 sides** *per dice*"
                        );
                        return;
                    }
                    totalRoll = rolls.reduce((acc, roll) => acc + roll, 0);
                    resultText = formatRollResults(
                        rolls,
                        numDice,
                        diceSides,
                        totalRoll
                    );
                }
        
                //from the processModifiers, if the value returns as 501, this is due to one of the modifier values being higher than 100.  This is a bit hacky.
                let modifierTotal = processModifiers(modifiers);
                if (modifierTotal === 501) {
                    await interaction.reply("Modifiers cannot be greater or less than **100**");
                    return;
                }
                //otherwise, process modifier totals and add to total roll for final reply.
                if (modifiers.length > 0 && modifierTotal !== 0) {
                    totalRoll += modifierTotal;
                    resultText += `Modifier(s): ${modifiers.join(" ")} = ${modifierTotal}\nTotal Result: ${totalRoll}`;
                }
        
                await interaction.reply(resultText);
            }
        });
        
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
        
}
