"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
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
function validateConfig() {
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
//# sourceMappingURL=index.js.map