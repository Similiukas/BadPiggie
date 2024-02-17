import { AudioPlayerStatus, StreamType, VoiceConnection, createAudioPlayer, createAudioResource, entersState } from '@discordjs/voice';
import { stat } from 'node:fs/promises';

// TODO: man rodos vienas player per guild turetu but?
const player = createAudioPlayer();

export function subscribePlayer(connection: VoiceConnection) {
    connection.subscribe(player);
}

export async function playAudio() {
    const name = `recordings/v4/${Math.round(Math.random() * 100)}.ogg`;
    console.log('gonna try to play audio', name);

    stat(name).then(() => {
        const resource = createAudioResource(name, {
            inputType: StreamType.OggOpus
        });

        console.log('created audio resource');

        player.play(resource);

        console.log('will start to audio resource');
        return entersState(player, AudioPlayerStatus.Playing, 5e3);
    }).catch(() => {
        console.log('file not found');
    });
}
