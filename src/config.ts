import * as path from 'path';
import * as fs from 'fs';

interface Config {
    token: string;
    mongoConnectionString: string;
}

function loadConfig(): Config {
    const isDev = process.env.NODE_ENV === 'development';
    const configFile = isDev ? 'config.development.json' : 'config.json';

    let configPath = path.join(process.cwd(), configFile);

    if (!fs.existsSync(configPath)) {
        configPath = path.join(__dirname, '..', configFile);
    }

    if (!fs.existsSync(configPath)) {
        throw new Error(`Config file not found: ${configFile}`);
    }

    let configData = fs.readFileSync(configPath, 'utf8');

    // Remove BOM if present
    if (configData.charCodeAt(0) === 0xFEFF) {
        configData = configData.slice(1);
    }

    return JSON.parse(configData);
}

export const config = loadConfig();