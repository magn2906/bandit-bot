import * as path from 'path';
import * as fs from 'fs';

declare global {
    namespace NodeJS {
        interface Process {
            pkg?: any;
        }
    }
}

interface Config {
    token: string;
    mongoConnectionString: string;
}

function loadConfig(): Config {
    const isDev = process.env.NODE_ENV === 'development';
    const configFile = isDev ? 'config.development.json' : 'config.json';

    let configPath: string;
    let configData: string;

    if (process.pkg) {
        configPath = path.join(path.dirname(process.execPath), configFile);

        if (fs.existsSync(configPath)) {
            configData = fs.readFileSync(configPath, 'utf8');
        } else {
            try {
                configData = fs.readFileSync(path.join(__dirname, configFile), 'utf8');
            } catch {
                throw new Error(`Config file not found: ${configFile}. Place it next to the executable or in the bundled resources.`);
            }
        }
    } else {
        configPath = path.join(process.cwd(), configFile);

        if (!fs.existsSync(configPath)) {
            configPath = path.join(__dirname, '..', configFile);
        }

        if (!fs.existsSync(configPath)) {
            configPath = path.join(__dirname, configFile);
        }

        if (!fs.existsSync(configPath)) {
            throw new Error(`Config file not found: ${configFile}`);
        }

        configData = fs.readFileSync(configPath, 'utf8');
    }

    if (configData.charCodeAt(0) === 0xFEFF) {
        configData = configData.slice(1);
    }

    return JSON.parse(configData);
}

export const config = loadConfig();