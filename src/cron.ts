import { VoiceConnectionStatus, entersState, joinVoiceChannel } from '@discordjs/voice';
import { ChannelType, Client, VoiceChannel } from 'discord.js';
import cron from 'node-cron';
import { readdir } from 'node:fs/promises';
import { getConfig } from './configHandler';
import { playAudio, subscribePlayer, unsubscribePlayer } from './play';

export function setupCron(client: Client<boolean>, botId: string) {
    cron.schedule('*/27 * * * *', async () => {
        for (const guild of client.guilds.cache.values()) {
            const { ALLOW_RANDOM_JOIN } = await getConfig(guild.id);
            if (!ALLOW_RANDOM_JOIN) continue;

            const activeVoiceChannels = guild.channels.cache.filter((channel): channel is VoiceChannel =>
                channel.type === ChannelType.GuildVoice &&
                channel.members.size > 0 &&
                channel.members.every(member => member.user.id !== botId));
            if (activeVoiceChannels.size === 0) continue;

            const channel = activeVoiceChannels.random();
            if (!channel.joinable) continue;
            // No audio clips to play
            const files = await readdir(`recordings/${guild.id}`);
            if (files.length === 0) continue;

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                selfMute: false,
                selfDeaf: true,
                adapterCreator: channel.guild.voiceAdapterCreator
            });

            try {
                await entersState(connection, VoiceConnectionStatus.Ready, 20e3);

                subscribePlayer(connection);
                playAudio(guild.id, `recordings/${guild.id}/${files[Math.floor(Math.random() * files.length)]}`);

                setTimeout(() => {
                    connection.destroy();
                    unsubscribePlayer(guild.id);
                }, 9000);
            } catch (error) {
                console.error('Failed to randomly play something:', error);
                connection.destroy();
                unsubscribePlayer(guild.id);
            }
        }
    });
}
