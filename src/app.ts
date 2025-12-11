import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config, validateConfig } from './config';
import { errorHandler } from './utils/ErrorHandler';
import { initDatabase } from './services/DBService';
import routes from './routes';

// Validate environment configuration
validateConfig();

// Create Express app
const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://blackbox-backend-2z8a.onrender.com'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api', routes);

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
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
    try {
        await initDatabase();
        app.listen(config.port, () => {
            console.log(`
🚀 Blackbox Report API
━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on port ${config.port}
🔗 http://localhost:${config.port}
🔐 Authentication enabled
📝 Audit logging active
━━━━━━━━━━━━━━━━━━━━━━━━
      `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
