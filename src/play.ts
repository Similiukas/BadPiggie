import { AudioPlayer, AudioPlayerStatus, StreamType, VoiceConnection, createAudioPlayer, createAudioResource, entersState } from '@discordjs/voice';
import { readdir } from 'node:fs/promises';
import { PROBABILITY_TO_PLAY_SPECIAL } from './config.json';
import { getConfig } from './configHandler';

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
    if (Math.random() < PROBABILITY_TO_PLAY_SPECIAL) {
        name = `recordings/special/${Math.round(Math.random() * 4)}.ogg`;
    }

    const resource = createAudioResource(name, {
        inputType: StreamType.OggOpus
    });
    console.log(`[${new Date().toLocaleTimeString()}] playing audio ${name}`);

    const player = players.get(guildId);
    if (!player) return;

    player.play(resource);
    return entersState(player, AudioPlayerStatus.Playing, 5e3);
}

export async function maybePlayAudio(guildId: string) {
    const files = await readdir(`recordings/${guildId}`);

    const name = `recordings/${guildId}/${files[Math.floor(Math.random() * files.length)]}`;

    const { PROBABILITY_TO_SPEAK } = await getConfig(guildId);
    if (Math.random() > PROBABILITY_TO_SPEAK) {
        console.log(`[${new Date().toLocaleTimeString()}] didn't hit`);
        return;
    }

    playAudio(guildId, name);
}
