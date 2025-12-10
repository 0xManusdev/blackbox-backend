import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: parseInt(process.env['PORT'] || '3000', 10),
    databaseUrl: process.env['DATABASE_URL'] || '',
    geminiApiKey: process.env['GEMINI_API_KEY'] || '',
    ethPrivateKey: process.env['ETH_PRIVATE_KEY'] || '',
    ethRpcUrl: process.env['ETH_RPC_URL'] || '',
};

// Validate required environment variables
export function validateConfig(): void {
    const required = ['DATABASE_URL', 'GEMINI_API_KEY', 'ETH_PRIVATE_KEY', 'ETH_RPC_URL'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
    }
}
