import { AudioPlayerStatus, VoiceConnection, createAudioPlayer, createAudioResource, entersState } from '@discordjs/voice';

const player = createAudioPlayer();

export function subscribePlayer(connection: VoiceConnection) {
    connection.subscribe(player);
}

export async function playAudio() {
    // const resource = createAudioResource('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', {
    //     inputType: StreamType.Arbitrary
    // });

    const name = `recordings/v1/${Math.round(Math.random() * 10)}.ogg`;
    console.log('gonna try to play audio', name);

    // const source = createReadStream('src/output-501799902846648321-1708034303710.ogg');

    // const resource = createAudioResource('src/ba.mp3');
    const resource = createAudioResource(name);

    console.log('created audio resource');

    player.play(resource);

    console.log('will start to audio resource');

    return entersState(player, AudioPlayerStatus.Playing, 5e3);
}
