import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { config } from './config';
import { BannedWordService } from './services/BannedWordService';
import { MessageHandler } from './handlers/MessageHandler';
import { commands } from './commands';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const bannedWordService = new BannedWordService();
const messageHandler = new MessageHandler(bannedWordService);

client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user?.tag}!`);

    try {
        await bannedWordService.connect();
        await registerCommands();
    } catch (error) {
        console.error('Failed to initialize services:', error);
        process.exit(1);
    }
});

client.on('messageCreate', async (message) => {
    await messageHandler.handleMessage(message);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find(cmd => cmd.data.name === interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction, bannedWordService);
    } catch (error) {
        console.error('Error executing command:', error);

        const reply = { content: 'There was an error while executing this command!', ephemeral: true };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
        }
    }
});

async function registerCommands() {
    const rest = new REST().setToken(config.token);

    try {
        console.log('Started refreshing application (/) commands.');

        const commandData = commands.map(command => command.data.toJSON());

        // Register globally for all servers
        await rest.put(
            Routes.applicationCommands(client.user!.id),
            { body: commandData },
        );
        console.log(`Successfully reloaded ${commandData.length} global commands.`);

    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

client.on('guildCreate', async (guild) => {
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);

    // Register commands immediately for this guild
    const rest = new REST().setToken(config.token);
    const commandData = commands.map(command => command.data.toJSON());

    try {
        await rest.put(
            Routes.applicationGuildCommands(client.user!.id, guild.id),
            { body: commandData },
        );
        console.log(`Successfully registered ${commandData.length} commands for new guild: ${guild.name}`);
    } catch (error) {
        console.error(`Failed to register commands for new guild ${guild.name}:`, error);
    }
});

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await bannedWordService.close();
    void client.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await bannedWordService.close();
    void client.destroy();
    process.exit(0);
});

void client.login(config.token);