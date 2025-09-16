import {SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, ChatInputCommandInteraction} from 'discord.js';
import {BannedWordService} from '../services/BannedWordService';

export interface Command {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction, bannedWordService: BannedWordService) => Promise<void>;
}

export const commands: Command[] = [
    {
        data: new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Simple test command'),
        execute: async (interaction) => {
            await interaction.deferReply();
            await interaction.editReply('Pong!');
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('ban-word')
            .setDescription('Bans a word from being said in the server')
            .addStringOption(option =>
                option.setName('word')
                    .setDescription('Word to ban')
                    .setRequired(true)
            ),
        execute: async (interaction, bannedWordService) => {
            await interaction.deferReply();

            const word = interaction.options.getString('word', true);
            const guildId = interaction.guildId;

            if (!guildId) {
                await interaction.editReply('This command can only be used in a server!');
                return;
            }

            try {
                await bannedWordService.addBannedWord({
                    word,
                    guildId
                });
                await interaction.editReply(`Banned word "${word}"`);
            } catch (error) {
                console.error('Error in ban-word command:', error);
                await interaction.editReply(`Error banning word: ${error}`);
            }
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('unban-word')
            .setDescription('Unbans a word from being said in the server')
            .addStringOption(option =>
                option.setName('word')
                    .setDescription('Word to unban')
                    .setRequired(true)
            ),
        execute: async (interaction, bannedWordService) => {
            await interaction.deferReply();

            const word = interaction.options.getString('word', true);
            const guildId = interaction.guildId;

            if (!guildId) {
                await interaction.editReply('This command can only be used in a server!');
                return;
            }

            try {
                await bannedWordService.removeBannedWord(word, guildId);
                await interaction.editReply(`Unbanned word "${word}"`);
            } catch (error) {
                console.error('Error in unban-word command:', error);
                await interaction.editReply(`Error unbanning word: ${error}`);
            }
        },
    },
    {
        data: new SlashCommandBuilder()
            .setName('list-banned-words')
            .setDescription('Lists all banned words'),
        execute: async (interaction, bannedWordService) => {
            await interaction.deferReply();

            const guildId = interaction.guildId;

            if (!guildId) {
                await interaction.editReply('This command can only be used in a server!');
                return;
            }

            try {
                const bannedWords = await bannedWordService.getBannedWordsByGuild(guildId);
                const wordList = bannedWords.map(w => w.word);

                if (wordList.length === 0) {
                    await interaction.editReply('No banned words found.');
                } else {
                    await interaction.editReply(`Banned words:\n${wordList.join('\n')}`);
                }
            } catch (error) {
                console.error('Error in list-banned-words command:', error);
                await interaction.editReply(`Error listing banned words: ${error}`);
            }
        },
    },
];