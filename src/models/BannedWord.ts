import { ObjectId } from 'mongodb';

export interface BannedWord {
    _id?: ObjectId;
    word: string;
    guildId: string;
}