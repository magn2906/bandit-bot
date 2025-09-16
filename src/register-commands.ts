import { REST, Routes } from 'discord.js';
import { config } from './config';
import { commands } from './commands';

async function registerCommandsForGuild(guildId: string) {
    const rest = new REST().setToken(config.token);
    const commandData = commands.map(command => command.data.toJSON());

    try {
        console.log(`Registering ${commandData.length} commands for guild ${guildId}...`);

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID || 'YOUR_CLIENT_ID', guildId),
            { body: commandData },
        );

        console.log(`Successfully registered commands for guild ${guildId}!`);
    } catch (error) {
        console.error(`Failed to register commands for guild ${guildId}:`, error);
    }
}

// Usage: ts-node register-commands.ts
const guildId = process.argv[2];
if (!guildId) {
    console.log('Usage: ts-node register-commands.ts <GUILD_ID>');
    process.exit(1);
}

void registerCommandsForGuild(guildId);