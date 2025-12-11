import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/ErrorHandler';
import { analyzeAndAnonymize } from '../services/AIService';
import { timestampReport, hashContent } from '../services/BlockchainService';
import { saveReport, getAllReports, getReportById, Zone, Report } from '../services/DBService';
import { uploadFiles, isStorageConfigured } from '../services/StorageService';

// Valid zones mapping from frontend values
const ZONE_MAP: Record<string, Zone> = {
    'terminal_1': Zone.TERMINAL_1,
    'terminal_2': Zone.TERMINAL_2,
    'portes_embarquement': Zone.PORTES_EMBARQUEMENT,
    'zone_douanes': Zone.ZONE_DOUANES,
    'parking': Zone.PARKING,
    'hall_arrivee': Zone.HALL_ARRIVEE,
    'hall_depart': Zone.HALL_DEPART,
    'zone_transit': Zone.ZONE_TRANSIT,
    'autre': Zone.AUTRE,
};

// Request body interface
interface SubmitReportBody {
    zone: string;
    customZone?: string;
    incidentTime: string;
    description: string;
}

// Submit a new incident report
export const submitReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { zone, customZone, incidentTime, description } = req.body as SubmitReportBody;

    // Validate required fields
    if (!zone || !incidentTime || !description) {
        throw new AppError('zone, incidentTime, and description are required', 400);
    }

    // Validate zone
    const zoneLower = zone.toLowerCase();
    const zoneEnum = ZONE_MAP[zoneLower];
    if (!zoneEnum) {
        throw new AppError(`Invalid zone. Valid zones: ${Object.keys(ZONE_MAP).join(', ')}`, 400);
    }

    // Validate customZone for "autre"
    if (zoneEnum === Zone.AUTRE && !customZone) {
        throw new AppError('customZone is required when zone is "autre"', 400);
    }

    // Validate time format (HH:MM)
    if (!/^\d{1,2}:\d{2}(\s?(AM|PM))?$/i.test(incidentTime)) {
        throw new AppError('incidentTime must be in HH:MM format', 400);
    }

    if (description.trim().length === 0) {
        throw new AppError('description cannot be empty', 400);
    }

    console.log('📝 New report received, processing...');

    // Handle file uploads (if any)
    let attachmentUrls: string[] = [];
    const files = req.files as Express.Multer.File[] | undefined;
    
    if (files && files.length > 0) {
        if (files.length > 3) {
            throw new AppError('Maximum 3 files allowed', 400);
        }
        
        // Check file sizes (5MB max)
        const maxSize = 5 * 1024 * 1024;
        for (const file of files) {
            if (file.size > maxSize) {
                throw new AppError(`File ${file.originalname} exceeds 5MB limit`, 400);
            }
        }

        if (isStorageConfigured()) {
            console.log('📎 Uploading attachments...');
            attachmentUrls = await uploadFiles(files);
        } else {
            console.warn('⚠️ Storage not configured, skipping file uploads');
        }
    }

    // Build full description for AI analysis (include zone and time context)
    const zoneLabel = zoneEnum === Zone.AUTRE ? customZone : zone.replace('_', ' ');
    const fullDescription = `[Zone: ${zoneLabel}] [Heure: ${incidentTime}] ${description}`;

    // Step 1: AI Analysis and Anonymization
    console.log('🤖 Analyzing with AI...');
    const aiResult = await analyzeAndAnonymize(fullDescription);

    // Step 2: Blockchain Timestamping
    console.log('⛓️ Timestamping on blockchain...');
    const blockchainResult = await timestampReport(aiResult.anonymizedContent);

    // Step 3: Save to Database
    console.log('💾 Saving to database...');
    const report = await saveReport({
        zone: zoneEnum,
        customZone: zoneEnum === Zone.AUTRE ? customZone : undefined,
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
export const getReports = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const reports = await getAllReports();

    res.json({
        success: true,
        count: reports.length,
        data: reports.map((r: Report) => ({
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
export const getReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] || '', 10);

    if (isNaN(id)) {
        throw new AppError('Invalid report ID', 400);
    }

    const report = await getReportById(id);

    if (!report) {
        throw new AppError('Report not found', 404);
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
export const verifyReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] || '', 10);

    if (isNaN(id)) {
        throw new AppError('Invalid report ID', 400);
    }

    const report = await getReportById(id);

    if (!report) {
        throw new AppError('Report not found', 404);
    }

    const currentHash = hashContent(report.anonymized_content);
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
export const resolveReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] || '', 10);

    if (isNaN(id)) {
        throw new AppError('Invalid report ID', 400);
    }

    if (!req.admin) {
        throw new AppError('Unauthorized', 401);
    }

    const report = await getReportById(id);

    if (!report) {
        throw new AppError('Report not found', 404);
    }

    const { prisma } = await import('../services/DBService');
    
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
export const deleteReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] || '', 10);

    if (isNaN(id)) {
        throw new AppError('Invalid report ID', 400);
    }

    if (!req.admin) {
        throw new AppError('Unauthorized', 401);
    }

    const report = await getReportById(id);

    if (!report) {
        throw new AppError('Report not found', 404);
    }

    const { prisma } = await import('../services/DBService');
    
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
