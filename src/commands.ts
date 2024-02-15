import { VoiceConnection, VoiceConnectionStatus, entersState, joinVoiceChannel } from '@discordjs/voice';
import { CommandInteraction, GuildMember } from 'discord.js';
import { playAudio, subscribePlayer } from './play';
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
                selfMute: false,
                // Currently voice is built in mind with API v10 whereas discord.js v13 uses API v9.
                adapterCreator: channel.guild.voiceAdapterCreator
            });
        } else {
            await interaction.followUp('Join a voice channel and then try that again!');
            return;
        }
    }

    console.log('joined voice channel');

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 20e3);

        subscribePlayer(connection);

        const receiver = connection.receiver;
        receiver.speaking.on('start', userId => {
            // So if person stops speaking for a split second and resumes, this will hit again and start recording another file, while the first one is still recording
            // Zodziu, sunkiausia ir idomiausia dalis, tai kad jeigu jau irasomas, tai nereiktu dar karta irasineti man rodos
            // Tuo paciu, jeigu labai trumpas, tai irgi nereikia irasineti, bet cia va iskyla problema, nes neaisku ar trumpas bus ar ne, todel bus daug garbage, kuriuose reikes atrinkti. Pradedi rasyt, labai trumpas, tai net nesaugai
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

async function play(interaction: CommandInteraction) {
    try {
        playAudio();
        interaction.reply('Playing audio');
    } catch (error) {
        interaction.reply('Failed to play audio');
    }
}

export const commandHandler = new Map([['join', join], ['leave', leave], ['play', play]]);
