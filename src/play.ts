import { AudioPlayer, AudioPlayerStatus, StreamType, VoiceConnection, createAudioPlayer, createAudioResource, entersState } from '@discordjs/voice';
import { readdir } from 'node:fs/promises';
import { PROBABILITY_TO_PLAY_SPECIAL } from './config.json';

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

export async function playAudio(guildId: string, probability: number, name?: string) {
    if (Math.random() > probability) {
        console.log(`[${new Date().toLocaleTimeString()}] didn't hit`);
        return;
    }

    const player = players.get(guildId);
    if (!player) return;

    if (!name) {
        const files = await readdir(`recordings/${guildId}`);
        name = `recordings/${guildId}/${files[Math.floor(Math.random() * files.length)]}`;
    }

    if (Math.random() < PROBABILITY_TO_PLAY_SPECIAL) {
        name = `recordings/special/${Math.round(Math.random() * 5)}.ogg`;
    }

    const resource = createAudioResource(name, { inputType: StreamType.OggOpus });
    console.log(`[${new Date().toLocaleTimeString()}] playing audio ${name}`);

    player.play(resource);
    return entersState(player, AudioPlayerStatus.Playing, 5e3);
}
