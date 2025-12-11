"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const config_1 = require("./config");
const ErrorHandler_1 = require("./utils/ErrorHandler");
const DBService_1 = require("./services/DBService");
const routes_1 = __importDefault(require("./routes"));
// Validate environment configuration
(0, config_1.validateConfig)();
// Create Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:3001',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// API Routes
app.use('/api', routes_1.default);
// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        name: 'Blackbox Report API',
        version: '1.0.0',
        description: 'Anonymous Airport Incident Reporting with AI & Blockchain',
        endpoints: {
            health: 'GET /api/health',
            zones: 'GET /api/zones',
            submitReport: 'POST /api/reports',
            getReport: 'GET /api/reports/:id',
            verifyReport: 'GET /api/reports/:id/verify',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout',
                me: 'GET /api/auth/me',
            },
            admin: {
                getReports: 'GET /api/reports (protected)',
                resolveReport: 'PUT /api/reports/:id/resolve (protected)',
                deleteReport: 'DELETE /api/reports/:id (protected)',
                auditLogs: 'GET /api/admin/logs (protected)',
            },
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
🚀 Blackbox Report API
━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on port ${config_1.config.port}
🔗 http://localhost:${config_1.config.port}
🔐 Authentication enabled
📝 Audit logging active
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