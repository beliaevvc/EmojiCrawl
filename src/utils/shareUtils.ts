import { DeckConfig } from '../types/game';

// Encode DeckConfig to Base64 string
export const encodeDeckConfig = (config: DeckConfig): string => {
    try {
        const jsonString = JSON.stringify(config);
        // Encode using btoa, handling UTF-8 characters correctly
        const base64 = btoa(new TextEncoder().encode(jsonString).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        return base64;
    } catch (e) {
        console.error("Failed to encode deck config:", e);
        return "";
    }
};

// Decode Base64 string to DeckConfig
export const decodeDeckConfig = (code: string): DeckConfig | null => {
    try {
        // Decode using atob, handling UTF-8 characters correctly
        const jsonString = new TextDecoder().decode(Uint8Array.from(atob(code), c => c.charCodeAt(0)));
        const config = JSON.parse(jsonString);

        // Basic validation (check for required fields)
        if (
            config &&
            typeof config === 'object' &&
            config.character &&
            Array.isArray(config.shields) &&
            Array.isArray(config.weapons) &&
            Array.isArray(config.potions) &&
            Array.isArray(config.coins) &&
            Array.isArray(config.spells) &&
            Array.isArray(config.monsters)
        ) {
            return config as DeckConfig;
        }
        return null;
    } catch (e) {
        console.error("Failed to decode deck config:", e);
        return null;
    }
};

