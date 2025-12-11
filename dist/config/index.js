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
};
// Validate required environment variables
function validateConfig() {
    const required = ['DATABASE_URL', 'GEMINI_API_KEY', 'ETH_PRIVATE_KEY', 'ETH_RPC_URL'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
    }
}
//# sourceMappingURL=index.js.map