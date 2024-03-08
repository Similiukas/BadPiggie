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
                },
                {
                    name: 'config',
                    description: 'Displays the current configuration for the bot',
                    default_member_permissions: '8',
                },
                {
                    name: 'edit',
                    description: 'Edits the configuration file for the bot',
                    default_member_permissions: '8',
                    options: [
                        {
                            name: 'random-join',
                            type: 5,
                            description: 'Allows bot to randomly join voice channels',
                            required: true
                        },
                        {
                            name: 'speak-probability',
                            type: 10,
                            description: 'The probability that the bot will speak at time interval',
                            required: true,
                            min_value: 0,
                            max_value: 1
                        },
                        {
                            name: 'speak-interval',
                            type: 4,
                            description: 'The interval at which the bot will speak in seconds',
                            required: true,
                            min_value: 10,
                            max_value: 3600
                        },
                        {
                            name: 'recordable-role',
                            type: 8,
                            description: 'User role which bot can record. If not provided, bot will record all users.',
                            required: false
                        }
                    ]
                }
            ]}
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
