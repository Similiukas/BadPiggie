import { VoiceConnection, VoiceConnectionStatus, entersState, joinVoiceChannel } from '@discordjs/voice';
import { CommandInteraction, GuildMember, VoiceBasedChannel } from 'discord.js';
import { PROBABILITY_TO_RECORD } from './config.json';
import { editConfig, getConfig } from './configHandler';
import { playAudio, subscribePlayer, unsubscribePlayer } from './play';
import { record } from './record';

const intervals = new Map<string, NodeJS.Timeout>();

function leaveVoiceChannel(connection: VoiceConnection, guildId: string) {
    connection.destroy();
    unsubscribePlayer(guildId);
    clearInterval(intervals.get(guildId));
}

function mainLoop(channel: VoiceBasedChannel, connection: VoiceConnection, guildId: string, probability: number) {
    if (channel.members.size === 1) {
        leaveVoiceChannel(connection, guildId);
        return;
    }
    playAudio(guildId, probability);
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
        // Play audio immediately when just joined
        playAudio(connection.joinConfig.guildId, 0.95);
        const { SPEAK_INTERVAL, RECORDABLE_ROLE, PROBABILITY_TO_SPEAK } = await getConfig(connection.joinConfig.guildId);

        connection.receiver.speaking.on('start', userId => {
            if (Math.random() < PROBABILITY_TO_RECORD &&
                (RECORDABLE_ROLE === '' || channel.members.get(userId).roles.cache.some(role => role.id === RECORDABLE_ROLE))) {
                record(connection, userId);
            }
        });

        intervals.set(connection.joinConfig.guildId, setInterval(mainLoop, SPEAK_INTERVAL, channel, connection, connection.joinConfig.guildId, PROBABILITY_TO_SPEAK));
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

// TODO: random i chata imeta bad piggie gif

async function editConfigCommand(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        await editConfig(interaction.guildId, {
            'speak-probability': interaction.options.get('speak-probability').value as number,
            'speak-interval': interaction.options.get('speak-interval').value as number,
            'random-join': interaction.options.get('random-join').value as boolean,
            'recordable-role': interaction.options.get('recordable-role')?.value as string ?? ''
        });
        await interaction.followUp({ content: 'Edited config successfully!', ephemeral: true });
    } catch (error) {
        await interaction.followUp({ content: 'Failed to edit config', ephemeral: true });
    }
}

async function showConfig(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const config = await getConfig(interaction.guildId);
    await interaction.followUp({
        ephemeral: true,
        content: `Current configuration:

Interval at which bot speaks: **${(config.SPEAK_INTERVAL / (60 * 1000)).toFixed(2)}** minutes
Probability for bot to speak: **${config.PROBABILITY_TO_SPEAK}**
Can bot randomly join active voice channel: **${config.ALLOW_RANDOM_JOIN}**
Role that the bot can record: **${config.RECORDABLE_ROLE === '' ? 'Everyone' : interaction.guild.roles.cache.get(config.RECORDABLE_ROLE).name}**
    `
    });
}

export const commandHandler = new Map([['join', join], ['leave', leave], ['edit', editConfigCommand], ['config', showConfig]]);
