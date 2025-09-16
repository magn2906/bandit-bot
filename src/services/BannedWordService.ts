import { MongoClient, Db, Collection, MongoClientOptions } from 'mongodb';
import { BannedWord } from '../models/BannedWord';
import { config } from '../config';

export class BannedWordService {
    private client: MongoClient;
    private database: Db;
    private collection: Collection<BannedWord>;

    constructor() {
        const options: MongoClientOptions = {
            tls: true,
            tlsAllowInvalidCertificates: false,
            tlsAllowInvalidHostnames: false,
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 30000,
        };

        this.client = new MongoClient(config.mongoConnectionString, options);
        this.database = this.client.db('bandit');
        this.collection = this.database.collection<BannedWord>('bannedWords');
    }

    async connect(): Promise<void> {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                console.log(`Attempting MongoDB connection (${retryCount + 1}/${maxRetries})...`);
                await this.client.connect();
                console.log('Connected to MongoDB successfully');

                // Test the connection
                await this.client.db('admin').command({ ping: 1 });
                console.log('MongoDB ping successful');
                return;
            } catch (error) {
                retryCount++;
                console.error(`MongoDB connection attempt ${retryCount} failed:`, error);

                if (retryCount >= maxRetries) {
                    console.error('All MongoDB connection attempts failed');
                    throw error;
                }

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async addBannedWord(word: BannedWord): Promise<void> {
        await this.collection.insertOne(word);
    }

    async removeBannedWord(word: string, guildId: string): Promise<void> {
        await this.collection.deleteOne({
            word: word,
            guildId: guildId
        });
    }

    async getBannedWordsByGuild(guildId: string): Promise<BannedWord[]> {
        return await this.collection.find({ guildId }).toArray();
    }

    async close(): Promise<void> {
        await this.client.close();
    }
}