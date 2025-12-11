"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReport = exports.resolveReport = exports.verifyReport = exports.getReport = exports.getReports = exports.submitReport = void 0;
const ErrorHandler_1 = require("../utils/ErrorHandler");
const AIService_1 = require("../services/AIService");
const BlockchainService_1 = require("../services/BlockchainService");
const DBService_1 = require("../services/DBService");
const StorageService_1 = require("../services/StorageService");
// Valid zones mapping from frontend values
const ZONE_MAP = {
    'terminal_1': DBService_1.Zone.TERMINAL_1,
    'terminal_2': DBService_1.Zone.TERMINAL_2,
    'portes_embarquement': DBService_1.Zone.PORTES_EMBARQUEMENT,
    'zone_douanes': DBService_1.Zone.ZONE_DOUANES,
    'parking': DBService_1.Zone.PARKING,
    'hall_arrivee': DBService_1.Zone.HALL_ARRIVEE,
    'hall_depart': DBService_1.Zone.HALL_DEPART,
    'zone_transit': DBService_1.Zone.ZONE_TRANSIT,
    'autre': DBService_1.Zone.AUTRE,
};
// Submit a new incident report
exports.submitReport = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { zone, customZone, incidentTime, description } = req.body;
    // Validate required fields
    if (!zone || !incidentTime || !description) {
        throw new ErrorHandler_1.AppError('zone, incidentTime, and description are required', 400);
    }
    // Validate zone
    const zoneLower = zone.toLowerCase();
    const zoneEnum = ZONE_MAP[zoneLower];
    if (!zoneEnum) {
        throw new ErrorHandler_1.AppError(`Invalid zone. Valid zones: ${Object.keys(ZONE_MAP).join(', ')}`, 400);
    }
    // Validate customZone for "autre"
    if (zoneEnum === DBService_1.Zone.AUTRE && !customZone) {
        throw new ErrorHandler_1.AppError('customZone is required when zone is "autre"', 400);
    }
    // Validate time format (HH:MM)
    if (!/^\d{1,2}:\d{2}(\s?(AM|PM))?$/i.test(incidentTime)) {
        throw new ErrorHandler_1.AppError('incidentTime must be in HH:MM format', 400);
    }
    if (description.trim().length === 0) {
        throw new ErrorHandler_1.AppError('description cannot be empty', 400);
    }
    console.log('📝 New report received, processing...');
    // Handle file uploads (if any)
    let attachmentUrls = [];
    const files = req.files;
    if (files && files.length > 0) {
        if (files.length > 3) {
            throw new ErrorHandler_1.AppError('Maximum 3 files allowed', 400);
        }
        // Check file sizes (5MB max)
        const maxSize = 5 * 1024 * 1024;
        for (const file of files) {
            if (file.size > maxSize) {
                throw new ErrorHandler_1.AppError(`File ${file.originalname} exceeds 5MB limit`, 400);
            }
        }
        if ((0, StorageService_1.isStorageConfigured)()) {
            console.log('📎 Uploading attachments...');
            attachmentUrls = await (0, StorageService_1.uploadFiles)(files);
        }
        else {
            console.warn('⚠️ Storage not configured, skipping file uploads');
        }
    }
    // Build full description for AI analysis (include zone and time context)
    const zoneLabel = zoneEnum === DBService_1.Zone.AUTRE ? customZone : zone.replace('_', ' ');
    const fullDescription = `[Zone: ${zoneLabel}] [Heure: ${incidentTime}] ${description}`;
    // Step 1: AI Analysis and Anonymization
    console.log('🤖 Analyzing with AI...');
    const aiResult = await (0, AIService_1.analyzeAndAnonymize)(fullDescription);
    // Step 2: Blockchain Timestamping
    console.log('⛓️ Timestamping on blockchain...');
    const blockchainResult = await (0, BlockchainService_1.timestampReport)(aiResult.anonymizedContent);
    // Step 3: Save to Database
    console.log('💾 Saving to database...');
    const report = await (0, DBService_1.saveReport)({
        zone: zoneEnum,
        customZone: zoneEnum === DBService_1.Zone.AUTRE ? customZone : undefined,
        incidentTime,
        description,
        anonymizedContent: aiResult.anonymizedContent,
        category: aiResult.category,
        severity: aiResult.severity,
        aiAnalysis: aiResult.analysis,
        contentHash: blockchainResult.contentHash,
        blockchainTxHash: blockchainResult.txHash,
        attachments: attachmentUrls,
    });
    console.log('✅ Report processed successfully');
    res.status(201).json({
        success: true,
        data: {
            id: report.id,
            zone: report.zone,
            incidentTime: report.incident_time,
            category: report.category,
            severity: report.severity,
            analysis: report.ai_analysis,
            anonymizedContent: report.anonymized_content,
            attachments: report.attachments,
            blockchain: {
                txHash: blockchainResult.txHash,
                contentHash: blockchainResult.contentHash,
                blockNumber: blockchainResult.blockNumber,
                explorerUrl: `https://sepolia.etherscan.io/tx/${blockchainResult.txHash}`,
            },
            createdAt: report.created_at,
        },
    });
});
// Get all reports
exports.getReports = (0, ErrorHandler_1.asyncHandler)(async (_req, res) => {
    const reports = await (0, DBService_1.getAllReports)();
    res.json({
        success: true,
        count: reports.length,
        data: reports.map((r) => ({
            id: r.id,
            zone: r.zone,
            customZone: r.custom_zone,
            incidentTime: r.incident_time,
            category: r.category,
            severity: r.severity,
            anonymizedContent: r.anonymized_content,
            attachments: r.attachments,
            blockchainTxHash: r.blockchain_tx_hash,
            createdAt: r.created_at,
        })),
    });
});
// Get single report by ID
exports.getReport = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const id = parseInt(req.params['id'] || '', 10);
    if (isNaN(id)) {
        throw new ErrorHandler_1.AppError('Invalid report ID', 400);
    }
    const report = await (0, DBService_1.getReportById)(id);
    if (!report) {
        throw new ErrorHandler_1.AppError('Report not found', 404);
    }
    res.json({
        success: true,
        data: {
            id: report.id,
            zone: report.zone,
            customZone: report.custom_zone,
            incidentTime: report.incident_time,
            description: report.description,
            category: report.category,
            severity: report.severity,
            analysis: report.ai_analysis,
            anonymizedContent: report.anonymized_content,
            attachments: report.attachments,
            blockchain: {
                txHash: report.blockchain_tx_hash,
                contentHash: report.content_hash,
                explorerUrl: `https://sepolia.etherscan.io/tx/${report.blockchain_tx_hash}`,
            },
            createdAt: report.created_at,
        },
    });
});
// Verify report integrity
exports.verifyReport = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const id = parseInt(req.params['id'] || '', 10);
    if (isNaN(id)) {
        throw new ErrorHandler_1.AppError('Invalid report ID', 400);
    }
    const report = await (0, DBService_1.getReportById)(id);
    if (!report) {
        throw new ErrorHandler_1.AppError('Report not found', 404);
    }
    const currentHash = (0, BlockchainService_1.hashContent)(report.anonymized_content);
    const isValid = currentHash === report.content_hash;
    res.json({
        success: true,
        data: {
            reportId: report.id,
            integrityValid: isValid,
            storedHash: report.content_hash,
            calculatedHash: currentHash,
            blockchainTxHash: report.blockchain_tx_hash,
            explorerUrl: `https://sepolia.etherscan.io/tx/${report.blockchain_tx_hash}`,
        },
    });
});
// Admin: Mark report as resolved
exports.resolveReport = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const id = parseInt(req.params['id'] || '', 10);
    if (isNaN(id)) {
        throw new ErrorHandler_1.AppError('Invalid report ID', 400);
    }
    if (!req.admin) {
        throw new ErrorHandler_1.AppError('Unauthorized', 401);
    }
    const report = await (0, DBService_1.getReportById)(id);
    if (!report) {
        throw new ErrorHandler_1.AppError('Report not found', 404);
    }
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../services/DBService')));
    const updatedReport = await prisma.report.update({
        where: { id },
        data: {
            status: 'resolved',
            resolvedBy: req.admin.id,
            resolvedAt: new Date(),
        },
    });
    res.json({
        success: true,
        message: 'Signalement marqué comme résolu',
        data: {
            id: updatedReport.id,
            status: updatedReport.status,
            resolvedBy: req.admin.id,
            resolvedAt: updatedReport.resolvedAt,
        },
    });
});
// Admin: Delete report
exports.deleteReport = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const id = parseInt(req.params['id'] || '', 10);
    if (isNaN(id)) {
        throw new ErrorHandler_1.AppError('Invalid report ID', 400);
    }
    if (!req.admin) {
        throw new ErrorHandler_1.AppError('Unauthorized', 401);
    }
    const report = await (0, DBService_1.getReportById)(id);
    if (!report) {
        throw new ErrorHandler_1.AppError('Report not found', 404);
    }
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../services/DBService')));
    await prisma.report.delete({
        where: { id },
    });
    res.json({
        success: true,
        message: 'Signalement supprimé avec succès',
        data: {
            id,
            deletedBy: req.admin.id,
            deletedAt: new Date(),
        },
    });
});
//# sourceMappingURL=ReportController.js.map