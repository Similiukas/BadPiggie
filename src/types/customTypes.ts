// Have to import this as you cannot extends import('discord.js').Client
import { Client } from 'discord.js';

export interface CustomClient extends Client {
    commands?: import('discord.js').Collection<string, any>;
}
