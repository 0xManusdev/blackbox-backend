"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const ErrorHandler_1 = require("./utils/ErrorHandler");
const DBService_1 = require("./services/DBService");
const routes_1 = __importDefault(require("./routes"));
// Validate environment configuration
(0, config_1.validateConfig)();
// Create Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// API Routes
app.use('/api', routes_1.default);
// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        name: 'AeroChain Sentinel API',
        version: '1.0.0',
        description: 'Anonymous Airport Incident Reporting with AI & Blockchain',
        endpoints: {
            health: 'GET /api/health',
            submitReport: 'POST /api/reports',
            getReports: 'GET /api/reports',
            getReport: 'GET /api/reports/:id',
            verifyReport: 'GET /api/reports/:id/verify',
        },
    });
});
// Error handling middleware (must be last)
app.use(ErrorHandler_1.errorHandler);
// Start server
async function startServer() {
    try {
        await (0, DBService_1.initDatabase)();
        app.listen(config_1.config.port, () => {
            console.log(`
🚀 AeroChain Sentinel API
━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on port ${config_1.config.port}
🔗 http://localhost:${config_1.config.port}
━━━━━━━━━━━━━━━━━━━━━━━━
      `);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=app.js.map