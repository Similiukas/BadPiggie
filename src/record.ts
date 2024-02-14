import { EndBehaviorType, VoiceConnection } from '@discordjs/voice';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import * as prism from 'prism-media';

export async function record(connection: VoiceConnection, userId: string) {
    const receiver = connection.receiver;
    const subscription = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 1000
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

    const out = createWriteStream('output.ogg');

    pipeline(subscription, oggStream, out).catch(console.error).finally(() => {
        console.log('done');
    });
}
