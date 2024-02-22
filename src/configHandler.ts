import { stat, writeFile } from 'fs/promises';

export function createConfig(guildId: string) {
    stat(`configs/${guildId}.json`).catch(() => {
        writeFile(`configs/${guildId}.json`, JSON.stringify(
            {
                PROBABILITY_TO_SPEAK: 0.25,
                SPEAK_INTERVAL: 400000,
                ALLOW_RANDOM_JOIN: true
            }))
            .catch((err) => {
                console.error('Error creating config file', err);
            });
    });
}

export function editConfig(guildId: string, config: ConfigEditRequest) {
    return writeFile(`configs/${guildId}.json`, JSON.stringify({
        PROBABILITY_TO_SPEAK: config['speak-probability'],
        SPEAK_INTERVAL: config['speak-interval'] * 1000,
        ALLOW_RANDOM_JOIN: config['random-join']
    }));
}

export function getConfig(guildId: string): GuildConfig {
    return require(`../configs/${guildId}.json`);
}
