**Tested OS:**  Ubuntu Server 20 LTS

**Prerequisites:**

Node.js 20

Discord.js 14.14 (npm install discord.js)

MongoDB setup with no authentication (install mongodb application AND npm install mongodb)

**NOTE:** *MUST RENAME `config-new.json` TO `config.json` AND PROVIDE YOUR BOT KEY AND ADDITIONAL CONFIGURATIONS, INCLUDING ENABLING EACH MODULE.  ALL MODULES ARE DISABLED BY DEFAULT, AND ONLY CONNECTION IS TESTED.*

__Current Features:__

**Reaction Roles:**  Add a specific message and reaction emojis desired to the config.json file.  As of this commit, only two roles are supported.  This will be a feature that is updated soon.

**Discord Streamers**: 

*NOTE*:
REQUIRES MONGODB DEFAULT SETUP AND CONNECTION STRING!
*MAY REQUIRE A DB TITLED "TwitchMsgDb", BUT MAY AUTOMATICALLY CREATE ONE, **NOT TESTED.***

Will check everyone in a specific role for the "Streaming" activity in Discord.  Meaning the user will have to link their streaming (Twitch, or any other service that triggers the "Streaming" activity in Discord) account to be considered for shoutouts. This will, by default, @ the role in the shoutout, to notify other users in the role that someone is streaming.  Specific Channel ID required for shoutouts.  Messages will be deleted when the user is no longer showing as "Streaming" in Discord Activity feeds.

**Dice Roll:** Slash command (/roll) commands.  These include /roll d20; /roll d (1-100 sides); /roll n (1-100 for sides and dice); /roll advantage/disadvantage.  All of which can take up to 5 modifiers, ex: /roll + 1 + 2 + 5 - 2 + 7.  Modifiers cannot exceed values greater than 100 or less than -100. 
