import type { Guild } from 'discord.js';

export const deploy = async (guild: Guild) => {
    await guild.commands.set([
        {
            name: 'join',
            description: 'Joins the voice channel that you are in'
        },
        {
            name: 'leave',
            description: 'Leave the voice channel'
        }
    ]);
};
