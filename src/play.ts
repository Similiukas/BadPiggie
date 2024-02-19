import { AudioPlayer, AudioPlayerStatus, StreamType, VoiceConnection, createAudioPlayer, createAudioResource, entersState } from '@discordjs/voice';
import { stat } from 'node:fs/promises';
import { MAX_FILES_PER_GUILD, PROBABILITY_TO_SPEAK } from './config.json';

const players = new Map<string, AudioPlayer>();

export function subscribePlayer(connection: VoiceConnection) {
    const newPlayer = createAudioPlayer();
    connection.subscribe(newPlayer);
    players.set(connection.joinConfig.guildId, newPlayer);
}

export function unsubscribePlayer(guildId: string) {
    const player = players.get(guildId);
    if (player) {
        player.stop(true);
        players.delete(guildId);
    }
}

export function playAudio(guildId: string, name: string) {
    const resource = createAudioResource(name, {
        inputType: StreamType.OggOpus
    });
    console.log('playing audio', name);

    const player = players.get(guildId);
    if (!player) return;

    player.play(resource);
    return entersState(player, AudioPlayerStatus.Playing, 5e3);
}

export async function maybePlayAudio(guildId: string) {
    const name = `recordings/${guildId}/${Math.round(Math.random() * MAX_FILES_PER_GUILD / PROBABILITY_TO_SPEAK)}.ogg`;

    stat(name).then(() => {
        playAudio(guildId, name);
    }).catch(() => { });
}
