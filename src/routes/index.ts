import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
    submitReport,
    getReports,
    getReport,
    verifyReport,
    resolveReport,
    deleteReport,
} from '../controllers/ReportController';
import {
    register,
    login,
    logout,
    getCurrentAdmin,
    getAuditLogsController,
} from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { auditMiddleware } from '../middlewares/auditMiddleware';
import { Zone } from '../services/DBService';

const router = Router();

// Configure multer for file uploads (memory storage for Supabase)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
        files: 3, // Max 3 files
    },
    fileFilter: (_req, file, cb) => {
        // Allow images and common document types
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    },
});

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Blackbox Report API',
    });
});

// Get available zones
router.get('/zones', (_req: Request, res: Response) => {
    const zones = [
        { value: 'terminal_1', label: 'Terminal 1' },
        { value: 'terminal_2', label: 'Terminal 2' },
        { value: 'portes_embarquement', label: "Portes d'embarquement" },
        { value: 'zone_douanes', label: 'Zone de douanes' },
        { value: 'parking', label: 'Parking' },
        { value: 'hall_arrivee', label: "Hall d'arrivée" },
        { value: 'hall_depart', label: 'Hall de départ' },
        { value: 'zone_transit', label: 'Zone de transit' },
        { value: 'autre', label: 'Autre (saisir manuellement)' },
    ];

    res.json({
        success: true,
        data: zones,
    });
});

// Authentication routes (public)
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);

// Protected authentication routes
router.get('/auth/me', authMiddleware, getCurrentAdmin);

// Public report endpoints
router.post('/reports', upload.array('attachments', 3), submitReport);
router.get('/reports/:id', getReport);
router.get('/reports/:id/verify', verifyReport);

// Protected admin endpoints (with audit logging)
router.get('/reports', authMiddleware, auditMiddleware, getReports);
router.put('/reports/:id/resolve', authMiddleware, auditMiddleware, resolveReport);
router.delete('/reports/:id', authMiddleware, auditMiddleware, deleteReport);

// Admin audit logs
router.get('/admin/logs', authMiddleware, getAuditLogsController);

export default router;
