import { readFile, stat, writeFile } from 'fs/promises';

const DEFAULT_CONFIG = {
    PROBABILITY_TO_SPEAK: 0.25,
    SPEAK_INTERVAL: 400000,
    ALLOW_RANDOM_JOIN: true,
    RECORDABLE_ROLE: ''
};

export function createConfig(guildId: string) {
    stat(`configs/${guildId}.json`).catch(() => {
        writeFile(`configs/${guildId}.json`, JSON.stringify(DEFAULT_CONFIG)).catch((err) => {
            console.error('Error creating config file', err);
        });
    });
}

export function editConfig(guildId: string, config: ConfigEditRequest) {
    return writeFile(`configs/${guildId}.json`, JSON.stringify({
        PROBABILITY_TO_SPEAK: config['speak-probability'],
        SPEAK_INTERVAL: config['speak-interval'] * 1000,
        ALLOW_RANDOM_JOIN: config['random-join'],
        RECORDABLE_ROLE: config['recordable-role']
    }));
}

export async function getConfig(guildId: string): Promise<GuildConfig> {
    try {
        const data = await readFile(`configs/${guildId}.json`);
        return JSON.parse(data.toString());
    } catch (err) {
        console.error('Error reading config file', err);
        return DEFAULT_CONFIG;
    }
}
