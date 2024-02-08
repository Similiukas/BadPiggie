const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

TOKEN = process.env.TOKEN;
APP_ID = process.env.APP_ID;
DEV_SERVER_ID = process.env.DEV_SERVER_ID;

const commands = [];

async function importCommands() {
    const TestCommand = await import('./dist/commands/check.js');
    commands.push(TestCommand.default.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(TOKEN);

// and deploy your commands!
(async () => {
    try {
        await importCommands();
        console.log('commands', commands);
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(APP_ID, DEV_SERVER_ID),
            { body: commands }
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();
