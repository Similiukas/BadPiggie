import { EndBehaviorType, VoiceConnection } from '@discordjs/voice';
import { createWriteStream, unlink } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import * as prism from 'prism-media';
import {
    MAX_PARTITIONS_PER_GUILD,
    MAX_FILES_PER_USER_PER_PARTITION,
    MAX_RECORDING_LENGTH,
    MAX_RECORDING_SILENCE,
    MIN_RECORDING_SIZE,
    PROBABILITY_TO_RECORD,
    PARTITIONS_PER_SESSION
} from './config.json';
import { GuildMember } from 'discord.js';

// Partinions and file naming explained:
// The first 6 digits identify the user (userHash)
// The next 3 digits identify the partition
// The last 3 digits identify the audio in that partition
// Now what are partitions? Basically every "session" (every time bot joins the vc) a few random partitions are selected
// Then files are recording only in those partitions. This allows for older audio clips to stay longer and not be overwritten (that's the idea, does it work? idk)
// So in total, per session there can be PARTITIONS_PER_SESSION * MAX_FILES_PER_USER_PER_PARTITION * user amount files.
// And in total there can be MAX_PARTITIONS_PER_GUILD * MAX_FILES_PER_USER_PER_PARTITION * user amount files per guild.
// This user amount brings in randomness which does not allow to cap how many files there are in total per guild which is a bit annoying.
//
// The audio files played are random. There is no partitioning or anything for playing the audio. Would be nice to randomly select some person, so if one person
// yaps a lot it's not just that person's audio being played all the time. But that's a problem for another day TODO.
//
// User id is not actually necessary but could do funky stuff later (custom TTS) so left in here for future.
const partinions: Map<string, string[]> = new Map();

function getId(num: number): string {
    return Math.round(Math.random() * num).toString().padStart(3, '0');
}

function deleteFile(file: string) {
    unlink(file, (err) => {
        if (err) {
            console.error('Error deleting file', file, err);
        }
    });
}

function record(connection: VoiceConnection, userId: string, userHash: string, partitionId: string) {
    if (!partitionId) {
        console.error('Partition ID not found');
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

    const oggStream = new prism.opus.OggLogicalBitstream({
        opusHead: new prism.opus.OpusHead({
            channelCount: 2,
            sampleRate: 48000
        }),
        pageSizeControl: {
            maxPackets: 10
        }
    });

    // const fileName = `recordings/${connection.joinConfig.guildId}/${Math.round(Math.random() * MAX_FILES_PER_GUILD)}.ogg`;
    const fileName = `recordings/${connection.joinConfig.guildId}/${userHash}${partitionId}${getId(MAX_FILES_PER_USER_PER_PARTITION)}.ogg`;
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

export function subscribeRecorder(guildId: string) {
    partinions.set(guildId, Array.from({ length: PARTITIONS_PER_SESSION }, () => getId(MAX_PARTITIONS_PER_GUILD)));
}

export function unsubscribeRecorder(guildId: string) {
    partinions.delete(guildId);
}

export function recordController(connection: VoiceConnection, member: GuildMember, userId: string, recordableRole: string) {
    if ((recordableRole === '' || member.roles.cache.some(role => role.id === recordableRole)) &&
        Math.random() < PROBABILITY_TO_RECORD &&
        !connection.receiver.subscriptions.has(userId)) { // Not already recording
        record(connection, userId, userId.substring(0, 6), partinions.get(connection.joinConfig.guildId)[Math.round(Math.random() * (PARTITIONS_PER_SESSION - 1))]);
    }
}
