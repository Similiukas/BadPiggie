import { EndBehaviorType, VoiceConnection } from '@discordjs/voice';
import { createWriteStream, unlink } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import * as prism from 'prism-media';

const MAX_SILENCE = 2000;
const MAX_LENGTH = 7000;

function deleteFile(file: string) {
    unlink(file, (err) => {
        if (err) {
            console.error('Error deleting file', file, err);
        }
    });
}

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
            duration: MAX_SILENCE
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

    const fileName = `recordings/v4/${Math.round(Math.random() * 100)}.ogg`;
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
    }, MAX_LENGTH);

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
