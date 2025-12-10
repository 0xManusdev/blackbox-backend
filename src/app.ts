import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config';
import { errorHandler } from './utils/ErrorHandler';
import { initDatabase } from './services/DBService';
import routes from './routes';

// Validate environment configuration
validateConfig();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

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
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
    try {
        await initDatabase();
        app.listen(config.port, () => {
            console.log(`
🚀 AeroChain Sentinel API
━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on port ${config.port}
🔗 http://localhost:${config.port}
━━━━━━━━━━━━━━━━━━━━━━━━
      `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
