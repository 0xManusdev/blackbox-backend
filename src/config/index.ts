import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: parseInt(process.env['PORT'] || '3000', 10),
    databaseUrl: process.env['DATABASE_URL'] || '',
    geminiApiKey: process.env['GEMINI_API_KEY'] || '',
    ethPrivateKey: process.env['ETH_PRIVATE_KEY'] || '',
    ethRpcUrl: process.env['ETH_RPC_URL'] || '',
    // Supabase Storage
    supabaseUrl: process.env['SUPABASE_URL'] || '',
    supabaseServiceKey: process.env['SUPABASE_SERVICE_KEY'] || '',
    supabaseBucket: process.env['SUPABASE_BUCKET'] || 'attachments',
};

// Validate required environment variables
export function validateConfig(): void {
    const required = ['DATABASE_URL', 'GEMINI_API_KEY', 'ETH_PRIVATE_KEY', 'ETH_RPC_URL'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
    }

    // Warn about optional Supabase config
    if (!process.env['SUPABASE_URL'] || !process.env['SUPABASE_SERVICE_KEY']) {
        console.warn('Warning: Supabase not configured - file uploads will be disabled');
    }
}
