import { EndBehaviorType, VoiceConnection } from '@discordjs/voice';
import { createWriteStream, unlink } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import * as prism from 'prism-media';
import { MAX_FILES_PER_GUILD, MAX_RECORDING_LENGTH, MAX_RECORDING_SILENCE, MIN_RECORDING_SIZE } from './config.json';

function deleteFile(file: string) {
    unlink(file, (err) => {
        if (err) {
            console.error('Error deleting file', file, err);
        }
    });
}

// TODO:
// Reiketu padaryti cron, kad galetu isjungti in guild
// ir pakeisti cron job intervala, bet cia va jau sudetinga
// Reikia patikrinti, ar kol sukasi sitas cron ir botas prisijungia prie naujo guild, tai ar atsinaujina guilds cache
// [ ] error handling
// [ ] allow to add role of which users are recorded (so no other users are recorded)

export function record(connection: VoiceConnection, userId: string) {
    // Could also do this with a Map and then this would return a Promise, on which you reset that it stopped recording for user
    if (connection.receiver.subscriptions.has(userId)) return;

    const controller = new AbortController();
    const { signal } = controller;

    const subscription = connection.receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: MAX_RECORDING_SILENCE
        }
    });

    const oggStream = new prism.opus.OggLogicalBitstream({
        opusHead: new prism.opus.OpusHead({
            channelCount: 2,
            sampleRate: 48000
        }),
        pageSizeControl: {
            maxPackets: 10
        }
    });

    const fileName = `recordings/${connection.joinConfig.guildId}/${Math.round(Math.random() * MAX_FILES_PER_GUILD)}.ogg`;
    const out = createWriteStream(fileName);

    const timeout = setTimeout(() => {
        // Unpiping and then ending the stream will end all parent streams (can end only writable streams)
        subscription.unpipe(oggStream);
        oggStream.end();
        controller.abort();
    }, MAX_RECORDING_LENGTH);

    pipeline(subscription, oggStream, out, { signal }).then(() => {
        if (out.bytesWritten < MIN_RECORDING_SIZE) {
            deleteFile(fileName);
        }
    }).catch(() => {
        deleteFile(fileName);
    }).finally(() => {
        clearTimeout(timeout);
    });
}
