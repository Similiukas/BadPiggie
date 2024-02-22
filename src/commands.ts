import { VoiceConnection, VoiceConnectionStatus, entersState, joinVoiceChannel } from '@discordjs/voice';
import { CommandInteraction, GuildMember, VoiceBasedChannel } from 'discord.js';
import { PROBABILITY_TO_RECORD } from './config.json';
import { editConfig, getConfig } from './configHandler';
import { maybePlayAudio, subscribePlayer, unsubscribePlayer } from './play';
import { record } from './record';

let interval: NodeJS.Timeout;

function leaveVoiceChannel(connection: VoiceConnection, guildId: string) {
    connection.destroy();
    unsubscribePlayer(guildId);
    clearInterval(interval);
}

function mainLoop(channel: VoiceBasedChannel, connection: VoiceConnection, guildId: string) {
    maybePlayAudio(guildId);
    if (channel.members.size === 1) {
        leaveVoiceChannel(connection, guildId);
    }
}

async function join(interaction: CommandInteraction, connection?: VoiceConnection) {
    await interaction.deferReply();
    let channel: VoiceBasedChannel;
    if (!connection) {
        if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
            channel = interaction.member.voice.channel;
            connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                selfDeaf: false,
                selfMute: false,
                adapterCreator: channel.guild.voiceAdapterCreator
            });
        } else {
            await interaction.followUp('Join a voice channel and then try that again!');
            return;
        }
    }

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 20e3);

        subscribePlayer(connection);

        const receiver = connection.receiver;
        receiver.speaking.on('start', userId => {
            if (Math.random() < PROBABILITY_TO_RECORD) {
                record(connection, userId);
            }
        });

        const { SPEAK_INTERVAL } = getConfig(connection.joinConfig.guildId);

        interval = setInterval(mainLoop, SPEAK_INTERVAL, channel, connection, connection.joinConfig.guildId);
    } catch (error) {
        console.warn('Error occurred while joining voice channel:', error);
        await interaction.followUp('Failed to join voice channel within 20 seconds, please try again later!');
        leaveVoiceChannel(connection, connection.joinConfig.guildId);
        return;
    }

    await interaction.followUp(`Joined voice channel ${connection.joinConfig.group}!`);
}

async function leave(interaction: CommandInteraction, connection?: VoiceConnection) {
    if (connection) {
        leaveVoiceChannel(connection, connection.joinConfig.guildId);
        await interaction.reply('Left the voice channel!');
    } else {
        await interaction.reply('I am not in a voice channel!');
    }
}

async function editConfigCommand(interaction: CommandInteraction) {
    await interaction.deferReply();
    try {
        editConfig(interaction.guildId, {
            'speak-probability': interaction.options.get('speak-probability').value as number,
            'speak-interval': interaction.options.get('speak-interval').value as number,
            'random-join': interaction.options.get('random-join').value as boolean
        });
        await interaction.followUp('Edited config successfully!');
    } catch (error) {
        await interaction.followUp('Failed to edit config');
    }
}

export const commandHandler = new Map([['join', join], ['leave', leave], ['edit', editConfigCommand]]);
