import { AudioPlayer, AudioPlayerStatus, StreamType, VoiceConnection, createAudioPlayer, createAudioResource, entersState } from '@discordjs/voice';
import { readdir, stat } from 'node:fs/promises';

// TODO: man rodos vienas player per guild turetu but?
const players = new Map<string, AudioPlayer>();

function _playAudio(guildId: string, name: string) {
    const resource = createAudioResource(name, {
        inputType: StreamType.OggOpus
    });

    console.log('created audio resource');

    const player = players.get(guildId);
    if (!player) return;

    player.play(resource);

    console.log('will start to play audio resource');
    return entersState(player, AudioPlayerStatus.Playing, 5e3);
}

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

export async function maybePlayAudio(guildId: string) {
    const name = `recordings/v4/${Math.round(Math.random() * 100)}.ogg`;
    console.log('gonna try to play audio', name);

    stat(name).then(() => {
        _playAudio(guildId, name);
    }).catch(() => {
        console.log('file not found');
    });
}

export async function playAudio(guildId: string) {
    const files = await readdir('recordings/v4');

    const name = `recordings/v4/${files[Math.round(Math.random() * files.length)]}`;
    console.log('gonna defo play audio', name);

    return _playAudio(guildId, name);
}
