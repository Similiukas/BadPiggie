// Require the necessary discord.js classes
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import TestCommand from './commands/test.js';
import { CustomClient } from './types/customTypes';

config();

const TOKEN = process.env.TOKEN;

// console.log(TOKEN);
// console.log('dar kazkas pala pal');

// Create a new client instance
const client: CustomClient = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
client.commands.set(TestCommand.data.name, TestCommand);

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const _client = interaction.client as CustomClient;
    const command = _client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Log in to Discord with your client's token
client.login(TOKEN);
