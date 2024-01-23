# ILLEETS
## An open source Discord bot project
### Description
*...please be gentle...*

This project was designed around relearning JavaScript, and getting familiar with Node.js and 
Discord API. It is a WIP, and I highly encourage anyone who stumbles upon this to take it,
and make it better.

This isn't Open Source Licensed or anything fancy, just a project.  Take it and make it better.

---------------------------------------------------------------------------------------------------

### Tested OS:
Ubuntu Server 20 LTS

---------------------------------------------------------------------------------------------------

### Prerequisites:

**Node.js 20**

**Discord.js 14.14** (npm install discord.js)

**MongoDB** setup with *no authentication* (install mongodb application AND npm install mongodb)

***Your Own Discord Bot/Application*** - https://discord.com/developers

***Your Own Discord Server to which you are Admin/Owner*** - https://discord.com/

***OPTIONAL** - (Required for Open AI Chat Bot)* 
*- Open AI API Key*
*- Install node openai package (npm install openai)*

------------------------------------------------------------------------------------------------------

### Getting Started

__**NOTE:**__ *YOU MUST RENAME `config-new.json` TO `config.json` AND PROVIDE YOUR BOT KEY AND ADDITIONAL CONFIGURATIONS, INCLUDING ENABLING EACH MODULE.  ALL MODULES ARE DISABLED BY DEFAULT, AND ONLY CONNECTION IS TESTED.*

1. Install [Node.JS](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs) and [MongoDB](https://www.mongodb.com/docs/manual/installation/).  

2. Setup your NodeJS project directory using `npm init` from the root of the bot folder.

3. Install necessary prereqs with `npm install discord.js` and `npm install mongodb`

4. (Optional, but recommended) Install [NodeMon](https://www.npmjs.com/package/nodemon) so changes made in bot config/directory will restart the bot automatically.

5. Configure `config.json` at the top level bot config to includ the bot's ***TOKEN**, **APPLICATION ID**, and **GUILD ID** where the bot is invited.

6. From within the bot directory, either run `node index.js` or `nodemon index.js` and verify that you see the `"Logged in as 'Bot Name'"` in the console.

7. Make configuration changes to `config.json` to configure and enable features.

------------------------------------------------------------------------------------------------------

### Current Features

**AutoMod**: 

*NOTE: REQUIRES MONGODB DEFAULT SETUP AND CONNECTION STRING!*

- AutoMod feature, including **/warnings** commands for manually assigning and resetting warnings for users, permissions must be set under "Integrations" for the server. Dual list configuration available for "Blocked Terms" and "Bannable Terms" within `config.json` as arrays.  Logic is handled as such:

- Blocked Terms spoken by any member will result in the message being deleted, and a warning issued to the user.  Non-Mods will be given a timeout.

- Bannable Terms spoken by any member will result in the message being deleted, and a ban message being sent to chat.  Non-Mods will be given a ban.

- **Warnings** have *5 stages*
  - **Warning 1-2:** *Timeout for 60 seconds*
  - **Warning 3-4:** *Timeout for 60 minutes*
  - **Warning 5:** *Banned*

- Warnings automatically reset after 7 days after the last warning was given.

- Warnings/timeouts/banning is hard coded, and will need to be modified in the code directly.



**Reaction Roles:**  

- Allows the users to add themselves to the configured roles. 
- Create a message to be used as a Reaction Roles message, and provide the **Channel ID** and **Message ID** into the 
`config.json`.
- Additionally, if you would like a separate message for rules, there is configurable channel and message configuration.  If you want a separate message, but want to keep the same channel for roles and rules, simply leave the ID for rules channel blank.
- *NOTE: Only universal emojis have been tested.  Custom Discord emojis are not supported*



**Discord Streamers** 

*NOTE: REQUIRES MONGODB DEFAULT SETUP AND CONNECTION STRING!*

- Checks for a specific "Streamer" role, as configured in `config.json` to see if they are using the Discord Streaming activity.
  - To clarify, *Discord must show your icon as purple and "Streaming" to trigger this.  *NO TWITCH API INTEGRATION AT THIS TIME*
- Separate Moderator Streamer feature available.  If the user is in the default configured "Streamer" role, and is also in a specified Moderator role within the `config.json`, then a different shoutout will occur.  If no channel is specified, it should default to the default streams channel.
- Separate featured streamer feature available. If the user is in the default configured "Streamer" role, and is also in a specified special role within the `config.json`, then a different shoutout will occur. If no channel is specified, it should default to the default streams channel.



**XP Chat System** 

*NOTE: REQUIRES MONGODB DEFAULT SETUP AND CONNECTION STRING!*

- Awards 6XP per message for chatting, 
- Removes 1XP every 2 hours to handle inactive users. 
- Awards 4 roles, All configured in `config.json` in an array, *by name*.  
- Channel ID for announcements required in `config.json`.
- **/xpcheck** commands for all users 
- **/xp** commands for moderators, but **permissions must be set under "Integrations" for the server**.



**Open AI Chat Bot** 

- Chat bot that responds to @ mentions and replies to the bot. 
- Must be configured with personal Open AI API key, and chosen personality.  
- Designed to give short responses around a specific personality, and to never admit that it is a robot.
- If channelId is specified, the bot will only reply in that channel, otherwise it will reply to any @ mention or reply.



**Dice Roll:** 

- /roll commands.  
- **/roll d** (1-100 sides) 
- **/roll n** (1-100 for sides and dice); 
- **/roll advantage/disadvantage**.  
- All can take up to 5 modifiers, 
  - Example: /roll d20 + 1 + 2 + 5 - 2 + 7 
  - Modifiers cannot exceed values greater than 100 or less than -100.
  - A space between modifier (+/-) and each number is required
