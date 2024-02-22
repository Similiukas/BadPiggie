import { ApplicationCommandOptionType, type Guild } from 'discord.js';

export const deploy = async (guild: Guild) => {
    await guild.commands.set([
        {
            name: 'join',
            description: 'Joins the voice channel that you are in'
        },
        {
            name: 'leave',
            description: 'Leave the voice channels'
        },
        {
            name: 'edit',
            description: 'Edits the configuration file for the bot',
            default_member_permissions: '8',
            options: [
                {
                    name: 'random-join',
                    type: ApplicationCommandOptionType.Boolean,
                    description: 'Allows bot to randomly join voice channels',
                    required: true
                },
                {
                    name: 'speak-probability',
                    type: ApplicationCommandOptionType.Number,
                    description: 'The probability that the bot will speak at time interval',
                    required: true,
                    min_value: 0,
                    max_value: 1
                },
                {
                    name: 'speak-interval',
                    type: ApplicationCommandOptionType.Number,
                    description: 'The interval at which the bot will speak in seconds',
                    required: true,
                    min_value: 60,
                    max_value: 3600
                }
            ]
        }
    ]);
};
