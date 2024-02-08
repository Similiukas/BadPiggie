// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';

config();

const TOKEN = process.env.TOKEN;

// console.log(TOKEN);
// console.log('dar kazkas pala pal');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(TOKEN);
