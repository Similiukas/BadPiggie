import { AudioPlayer, AudioPlayerStatus, StreamType, VoiceConnection, createAudioPlayer, createAudioResource, entersState } from '@discordjs/voice';
import { stat } from 'node:fs/promises';

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

    console.log('created audio resource', name);

    const player = players.get(guildId);
    if (!player) return;

    player.play(resource);

    console.log('will start to play audio resource');
    return entersState(player, AudioPlayerStatus.Playing, 5e3);
}

export async function maybePlayAudio(guildId: string) {
    const name = `recordings/${guildId}/${Math.round(Math.random() * 100)}.ogg`;
    console.log('gonna try to play audio', name);

    stat(name).then(() => {
        playAudio(guildId, name);
    }).catch(() => {
        console.log('file not found');
    });
}
