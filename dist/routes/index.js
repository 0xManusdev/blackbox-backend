"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const ReportController_1 = require("../controllers/ReportController");
const AuthController_1 = require("../controllers/AuthController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const auditMiddleware_1 = require("../middlewares/auditMiddleware");
const router = (0, express_1.Router)();
// Configure multer for file uploads (memory storage for Supabase)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
        }
        else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    },
});
// Health check endpoint
router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Blackbox Report API',
    });
});
// Get available zones
router.get('/zones', (_req, res) => {
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
router.post('/auth/register', AuthController_1.register);
router.post('/auth/login', AuthController_1.login);
router.post('/auth/logout', AuthController_1.logout);
// Protected authentication routes
router.get('/auth/me', authMiddleware_1.authMiddleware, AuthController_1.getCurrentAdmin);
// Public report endpoints
router.post('/reports', upload.array('attachments', 3), ReportController_1.submitReport);
router.get('/reports/:id', ReportController_1.getReport);
router.get('/reports/:id/verify', ReportController_1.verifyReport);
// Protected admin endpoints (with audit logging)
router.get('/reports', authMiddleware_1.authMiddleware, auditMiddleware_1.auditMiddleware, ReportController_1.getReports);
router.put('/reports/:id/resolve', authMiddleware_1.authMiddleware, auditMiddleware_1.auditMiddleware, ReportController_1.resolveReport);
router.delete('/reports/:id', authMiddleware_1.authMiddleware, auditMiddleware_1.auditMiddleware, ReportController_1.deleteReport);
// Admin audit logs
router.get('/admin/logs', authMiddleware_1.authMiddleware, AuthController_1.getAuditLogsController);
exports.default = router;
//# sourceMappingURL=index.js.map