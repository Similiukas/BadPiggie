declare module 'duplex-child-process'

interface GuildConfig {
    PROBABILITY_TO_SPEAK: number,
    SPEAK_INTERVAL: number,
    ALLOW_RANDOM_JOIN: boolean,
    RECORDABLE_ROLE: string
}

interface ConfigEditRequest {
    'random-join': boolean,
    'speak-probability': number,
    'speak-interval': number,
    'recordable-role': string
}
