import {Message} from 'discord.js';
import {BannedWordService} from '../services/BannedWordService';
import {BannedWord} from '../models/BannedWord';

export class MessageHandler {
    constructor(private bannedWordService: BannedWordService) {
    }

    async handleMessage(message: Message): Promise<void> {
        if (message.author.bot || !message.guild) return;

        const messageContent = message.content;
        const bannedWords = await this.bannedWordService.getBannedWordsByGuild(message.guild.id);

        const bannedWordResult = this.checkForBannedWords(messageContent, bannedWords);

        if (bannedWordResult.isBanned) {
            try {
                await message.delete();
            } catch (error) {
                console.error('Error deleting message:', error);
            }

            const sanitizedBanned = bannedWordResult.bannedWord.replace(/\s+/g, '').toUpperCase();
            const pattern = new RegExp(
                `\\b${sanitizedBanned.split('').join('\\s*')}\\b`,
                'gi'
            );

            const encapsulatedMessage = messageContent.replace(
                pattern,
                `||${bannedWordResult.bannedWord}||`
            );

            try {
                if ('send' in message.channel) {
                    await message.channel.send(
                        `${message.author.username}: "${encapsulatedMessage}" contains a banned word`
                    );
                }
            } catch (error) {
                console.error('Error sending replacement message:', error);
            }
        }
    }

    private checkForBannedWords(
        messageContent: string,
        bannedWords: BannedWord[]
    ): { isBanned: boolean; bannedWord: string } {
        const sanitizedContent = messageContent.replace(/\s+/g, '').toUpperCase();

        for (const bannedWordObj of bannedWords) {
            const sanitizedBannedWord = bannedWordObj.word.replace(/\s+/g, '').toUpperCase();

            if (sanitizedContent.includes(sanitizedBannedWord)) {
                return {isBanned: true, bannedWord: bannedWordObj.word};
            }
        }

        return {isBanned: false, bannedWord: ''};
    }
}