import { getVoiceConnection } from '@discordjs/voice';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { mkdir, stat } from 'node:fs/promises';
import { commandHandler } from './commands.js';
import { createConfig } from './configHandler.js';
import { setupCron } from './cron.js';
import { deploy } from './deploy.js';

config();

const TOKEN = process.env.TOKEN;

const client = new Client({ intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    setupCron(client, readyClient.user.id);
    // Ensure that the recordings directory exists for every guild because maybe bot was added while it was offline
    client.guilds.cache.forEach(guild => {
        console.log(`Guild [${guild.name}] has id ${guild.id}`);
        stat(`recordings/${guild.id}`).catch(() => {
            mkdir(`recordings/${guild.id}`);
        });
        createConfig(guild.id);
    });
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
    if (!message.guild) return;
    if (!client.application?.owner) await client.application?.fetch();

    if (message.content.toLowerCase() === '!deploy' && message.author.id === client.application?.owner?.id) {
        console.log('deploying guild commands');
        await deploy(message.guild);
        await message.reply('Deployed!');
    }
});

client.on(Events.GuildCreate, async guild => {
    console.log('Joined guild', guild.name);
    stat(`recordings/${guild.id}`).catch(() => {
        mkdir(`recordings/${guild.id}`);
    });
    createConfig(guild.id);
});

client.on(Events.GuildDelete, async guild => {
    console.log('Left guild', guild.name);
});

client.on(Events.Error, console.warn);

client.login(TOKEN);
