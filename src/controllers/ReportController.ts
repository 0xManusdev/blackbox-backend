import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/ErrorHandler';
import { analyzeAndAnonymize } from '../services/AIService';
import { timestampReport, hashContent } from '../services/BlockchainService';
import { saveReport, getAllReports, getReportById } from '../services/DBService';

export const submitReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { content } = req.body as { content?: string };

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new AppError('Report content is required', 400);
    }

    console.log('📝 New report received, processing...');
    console.log('🤖 Analyzing with AI...');
    const aiResult = await analyzeAndAnonymize(content);
    console.log('⛓️ Timestamping on blockchain...');
    const blockchainResult = await timestampReport(aiResult.anonymizedContent);
    console.log('💾 Saving to database...');
    const report = await saveReport({
        original_content: content,
        anonymized_content: aiResult.anonymizedContent,
        category: aiResult.category,
        severity: aiResult.severity,
        ai_analysis: aiResult.analysis,
        content_hash: blockchainResult.contentHash,
        blockchain_tx_hash: blockchainResult.txHash,
    });

    console.log('✅ Report processed successfully');

    res.status(201).json({
        success: true,
        data: {
            id: report.id,
            category: report.category,
            severity: report.severity,
            analysis: report.ai_analysis,
            anonymizedContent: report.anonymized_content,
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

export const getReports = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const reports = await getAllReports();

    res.json({
        success: true,
        count: reports.length,
        data: reports.map((r) => ({
            id: r.id,
            category: r.category,
            severity: r.severity,
            anonymizedContent: r.anonymized_content,
            blockchainTxHash: r.blockchain_tx_hash,
            createdAt: r.created_at,
        })),
    });
});

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
            category: report.category,
            severity: report.severity,
            analysis: report.ai_analysis,
            anonymizedContent: report.anonymized_content,
            blockchain: {
                txHash: report.blockchain_tx_hash,
                contentHash: report.content_hash,
                explorerUrl: `https://sepolia.etherscan.io/tx/${report.blockchain_tx_hash}`,
            },
            createdAt: report.created_at,
        },
    });
});

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
