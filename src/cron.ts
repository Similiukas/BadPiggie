import { VoiceConnectionStatus, entersState, joinVoiceChannel } from '@discordjs/voice';
import { ChannelType, Client, Collection, VoiceChannel } from 'discord.js';
import cron from 'node-cron';
import { playAudio, subscribePlayer, unsubscribePlayer } from './play';

// TODO: patestuoti su keliais guilds
// Reiketu padaryti sita, kad galetu isjungti in guild
// ir pakeisti cron job intervala, bet cia va jau sudetinga
export function setupCron(client: Client<boolean>, botId: string) {
    cron.schedule('*/1 * * * *', async () => {
        for (const guild of client.guilds.cache.values()) {
            // @ts-ignore
            const activeVoiceChannels: Collection<string, VoiceChannel> = guild.channels.cache.filter(channel =>
                channel.type === ChannelType.GuildVoice &&
                channel.members.size > 0 &&
                channel.members.every(member => member.user.id !== botId));
            console.log('active voice channels we are not in', activeVoiceChannels);

            if (activeVoiceChannels.size === 0) continue;

            const channel = activeVoiceChannels.random();
            console.log('joining channel', channel);

            if (!channel.joinable) continue;

            try {
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    selfMute: false,
                    selfDeaf: true,
                    adapterCreator: channel.guild.voiceAdapterCreator
                });

                await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
                subscribePlayer(connection);
                playAudio(guild.id);
                setTimeout(() => {
                    connection.destroy();
                    unsubscribePlayer(guild.id);
                }, 7000);
            } catch (error) {
                console.error('Failed to randomly play something:', error);
            }
        }
    });
}
