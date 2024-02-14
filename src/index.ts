import { generateDependencyReport, getVoiceConnection } from '@discordjs/voice';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { commandHandler } from './commands.js';
import { deploy } from './deploy.js';
// import { CustomClient } from './types/types.js';

config();

const TOKEN = process.env.TOKEN;

console.log(generateDependencyReport());

const client = new Client({ intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const handler = commandHandler.get(interaction.commandName);

    try {
        if (handler) {
            await handler(interaction, getVoiceConnection(interaction.guildId));
        } else {
            await interaction.reply('Unknown command');
        }
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.on(Events.MessageCreate, async (message) => {
    console.log('message [', message.content, ']');
    if (!message.guild) { console.log('1'); return; }
    if (!client.application?.owner) await client.application?.fetch();
    console.log('2');
    if (message.content.toLowerCase() === '!deploy' && message.author.id === client.application?.owner?.id) {
        console.log('deploying');
        await deploy(message.guild);
        await message.reply('Deployed!');
    }
});

// client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
//     console.log('voice state update', oldState, newState);
// });

// client.on(Events.VoiceServerUpdate, async (oldState, newState) => {
//     console.log('voice server update', oldState, newState);
// });

client.login(TOKEN);
