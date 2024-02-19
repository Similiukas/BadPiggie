import { EndBehaviorType, VoiceConnection } from '@discordjs/voice';
import { createWriteStream, unlink } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import * as prism from 'prism-media';
import { MAX_RECORDING_LENGTH, MAX_RECORDING_SILENCE } from './config.json';

function deleteFile(file: string) {
    unlink(file, (err) => {
        if (err) {
            console.error('Error deleting file', file, err);
        }
    });
}

// TODO: should save files to their guild directories. Every guild should have its own directory
// Then should play only sounds from that guild
// Also, random sounds from that guild also

// TODO:
// [ ] cleanup
// [ ] patestuoti su keliais guild
// Reiketu padaryti cron, kad galetu isjungti in guild
// ir pakeisti cron job intervala, bet cia va jau sudetinga
// Reikia patikrinti, ar kol sukasi sitas cron ir botas prisijungia prie naujo guild, tai ar atsinaujina guilds cache
// [ ] probability of playing a sound
// [ ] error handling

export function record(connection: VoiceConnection, userId: string) {
    // TODO:
    // [X] - Abandon recording if it's too long (kinda the problem is that we abort but then it you stop for a split second and keep on yapping, it will record a new one. But maybe that's fine)
    // [X] - Do not save recording if it's too short
    // [X] - Do not record if already recording
    // [ ] - Look at optimizations
    // Could also do this with a Map and then this would return a Promise, on which you reset that it stopped recording for user
    if (connection.receiver.subscriptions.has(userId)) {
        console.log('already recording for', userId);
        return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const subscription = connection.receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: MAX_RECORDING_SILENCE
        }
    });

    // subscription.on('end', () => {
    //     console.log('S1 END', userId);
    // });
    // subscription.on('close', () => {
    //     console.log('S1 CLOSE', userId);
    // });

    const oggStream = new prism.opus.OggLogicalBitstream({
        opusHead: new prism.opus.OpusHead({
            channelCount: 2,
            sampleRate: 48000
        }),
        pageSizeControl: {
            maxPackets: 10
        }
    });

    // oggStream.on('end', () => {
    //     console.log('S2 END', userId);
    // });
    // oggStream.on('close', () => {
    //     console.log('S2 CLOSE', userId);
    // });

    const fileName = `recordings/${connection.joinConfig.guildId}/${Math.round(Math.random() * 100)}.ogg`;
    console.log('recording to', fileName);
    const out = createWriteStream(fileName);

    // out.on('end', () => {
    //     console.log('S3 END', userId);
    // });
    // out.on('close', () => {
    //     console.log('S3 CLOSE', userId);
    // });

    const timeout = setTimeout(() => {
        console.log('FORCING stopped recording');
        // Unpiping and then ending the stream will end all parent streams (can end only writable streams)
        subscription.unpipe(oggStream);
        oggStream.end();
        controller.abort();
    }, MAX_RECORDING_LENGTH);

    console.log('started recording');

    pipeline(subscription, oggStream, out, { signal }).then(() => {
        console.log('done writing file');
        console.log('res', out.bytesWritten);
        if (out.bytesWritten < 8000) {
            console.log('file too short, deleting');
            deleteFile(fileName);
        }
    }).catch((error) => {
        console.log('error writing file', error);
        deleteFile(fileName);
    }).finally(() => {
        clearTimeout(timeout);
    });
}
