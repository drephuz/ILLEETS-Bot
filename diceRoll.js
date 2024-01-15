module.exports = (client) => {
    console.log("Dice Roll module loaded.");

    client.on("messageCreate", (message) => {
        //check if a message was sent starting with /roll
        if (!message.content.startsWith("/roll")) return;

        //split the message down by removing spaces
        const args = message.content.slice(6).trim().split(/ +/);
        //process the command with step 1, breaking down the command into its parts and determining what those parts are.
        const { numDice, diceSides, modifiers, rollType } = processCommand(
            args
        );
        //assigning empty variables as declarations, and also to allow for new rolls
        let rolls = [];
        let totalRoll = 0;

        //if it's not a "normal" roll, it assumes it's with advantage/disadvantage.  This ternary automatically assigns 2 dice if it's not "normal". otherwise it's using numDice acquired from processCommand
        for (let i = 0; i < (rollType !== "normal" ? 2 : numDice); i++) {
            rolls.push(rollDice(diceSides));
        }

        //declaring empty resultText for a fresh call of data, due to how we are adding data to the message reply
        let resultText = "";
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
            message.reply("Modifiers cannot be greater or less than **100**");
            return;
        }
        //otherwise, process modifier totals and add to total roll for final reply.
        if (modifiers.length > 0 && modifierTotal !== 0) {
            totalRoll += modifierTotal;
            resultText += `Modifier(s): ${modifiers.join(
                " "
            )} = ${modifierTotal}\nTotal Result: ${totalRoll}`;
        }

        message.reply(resultText);
    });

    function processCommand(args) {
        let numDice = 1;
        let diceSides = 20;
        let modifiers = [];
        let rollType = "normal";

        if (args[0] === "advantage" || args[0] === "disadvantage") {
            rollType = args.shift();
        }

        if (args[0]?.includes("d")) {
            const diceConfig = args[0].split("d");
            numDice = diceConfig[0] ? diceConfig[0] : 1;
            diceSides = diceConfig[1] || 20;
            modifiers = args.slice(1);
        } else {
            modifiers = args;
        }

        return { numDice, diceSides, modifiers, rollType };
    }

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
};
