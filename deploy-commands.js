const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

TOKEN = process.env.TOKEN;
APP_ID = process.env.APP_ID;

const rest = new REST().setToken(TOKEN);

(async () => {
    try {
        console.log(`Started refreshing application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(APP_ID),
            { body:
            [
                {
                    name: 'join',
                    description: 'Joins the voice channel that you are in'
                },
                {
                    name: 'leave',
                    description: 'Leave the voice channel'
                }
            ]}
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
