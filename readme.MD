__**Tested OS:**__  Ubuntu Server 20 LTS

__**Prerequisites:**__

**Node.js 20**

**Discord.js 14.14** (npm install discord.js)

**MongoDB** setup with *no authentication* (install mongodb application AND npm install mongodb)

***Your Own Discord Bot/Application*** - https://discord.com/developers

***Your Own Discord Server to which you are Admin/Owner*** - https://discord.com/

***OPTIONAL** - (Required for Open AI Chat Bot)* 
*-Open AI API Key*
*-Install node openai package (npm install openai)*

__**NOTE:**__ *MUST RENAME `config-new.json` TO `config.json` AND PROVIDE YOUR BOT KEY AND ADDITIONAL CONFIGURATIONS, INCLUDING ENABLING EACH MODULE.  ALL MODULES ARE DISABLED BY DEFAULT, AND ONLY CONNECTION IS TESTED.*

__Current Features:__

**Reaction Roles:**  Add a specific message ID and reaction emojis desired to the config.json file.  Add as many reaction emoji's for each role added by name directly to the config file.  The bot should find the message, and automatically reply to the message with the emojis.

**Discord Streamers**: 

*NOTE*: REQUIRES MONGODB DEFAULT SETUP AND CONNECTION STRING!

Will check everyone in a specific role for the "Streaming" activity in Discord.  Meaning the user will have to link their streaming (Twitch, or any other service that triggers the "Streaming" activity in Discord) account to be considered for shoutouts. This will, by default, @ the role in the shoutout, to notify other users in the role that someone is streaming.  Specific Channel ID required for shoutouts.  Messages will be deleted when the user is no longer showing as "Streaming" in Discord Activity feeds.

**Dice Roll:** Slash command (/roll) commands.  These include **/roll d** (1-100 sides); **/roll n** (1-100 for sides and dice); **/roll advantage/disadvantage**.  All of which can take up to 5 modifiers, ex: /roll + 1 + 2 + 5 - 2 + 7.  Modifiers cannot exceed values greater than 100 or less than -100. 

**XP Chat System**: 

*NOTE*: REQUIRES MONGODB DEFAULT SETUP AND CONNECTION STRING!

Awards 6XP per message for chatting, removes 1XP every 2 hours to handle inactive users. Awards 4 roles, All configured in config.json in an array, by name.  Channel ID for announcements required in config.json. Also comes with **/xpcheck** commands for all users and **/xp** commands for moderators, but **permissions must be set under "Integrations" for the server**.

**Open AI Chat Bot**: Chat bot that responds to @ mentions and replies to the bot. Can be configured with personal Open AI API key, and chosen personality.  Designed to give short responses around a specific personality.

**AutoMod**: AutoMod feature, including **/warnings** commands for manually assigning warnings to users, permissions must be set under "Integrations" for the server. Dual list configuration available for blockedTerms and bannableTerms.  Logic is handled as such:

-Blocked Terms spoken by any member will result in the message being deleted, and a warning issued to the user.  Non-Mods will be given a timeout.

-Bannable Terms spoken by any member will result in the message being deleted, and a ban message being sent to chat.  Non-Mods will be given a ban.
