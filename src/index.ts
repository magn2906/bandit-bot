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

        if (process.env.NODE_ENV === 'development') {
            const guildId = '1011925605358514208';
            await rest.put(
                Routes.applicationGuildCommands(client.user!.id, guildId),
                { body: commandData },
            );
            console.log(`Successfully reloaded ${commandData.length} guild commands.`);
        } else {
            await rest.put(
                Routes.applicationCommands(client.user!.id),
                { body: commandData },
            );
            console.log(`Successfully reloaded ${commandData.length} global commands.`);
        }
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

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