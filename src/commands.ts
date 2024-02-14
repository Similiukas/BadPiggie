import { VoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import { CommandInteraction, GuildMember } from 'discord.js';
import { record } from './record';

async function join(interaction: CommandInteraction, connection?: VoiceConnection) {
    await interaction.deferReply();
    if (!connection) {
        if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
            const channel = interaction.member.voice.channel;
            connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                selfDeaf: false,
                selfMute: true,
                // Currently voice is built in mind with API v10 whereas discord.js v13 uses API v9.
                adapterCreator: channel.guild.voiceAdapterCreator
            });
        } else {
            await interaction.followUp('Join a voice channel and then try that again!');
            return;
        }
    }

    console.log('joined voice channel', connection);

    try {
        const receiver = connection.receiver;
        receiver.speaking.on('start', userId => {
            record(connection, userId);
        });
    } catch (error) {
        console.warn('Error occurred while joining voice channel:', error);
        await interaction.followUp('Failed to join voice channel within 20 seconds, please try again later!');
        connection.destroy();
        return;
    }

    // @ts-ignore
    await interaction.followUp(`This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`);
}

async function leave(interaction: CommandInteraction, connection?: VoiceConnection) {
    if (connection) {
        connection.destroy();
        await interaction.reply('Left the voice channel!');
    } else {
        await interaction.reply('I am not in a voice channel!');
    }
}

export const commandHandler = new Map([['join', join], ['leave', leave]]);
