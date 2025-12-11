"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyReport = exports.getReport = exports.getReports = exports.submitReport = void 0;
const ErrorHandler_1 = require("../utils/ErrorHandler");
const AIService_1 = require("../services/AIService");
const BlockchainService_1 = require("../services/BlockchainService");
const DBService_1 = require("../services/DBService");
// Submit a new incident report
exports.submitReport = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new ErrorHandler_1.AppError('Report content is required', 400);
    }
    console.log('📝 New report received, processing...');
    console.log('🤖 Analyzing with AI...');
    const aiResult = await (0, AIService_1.analyzeAndAnonymize)(content);
    console.log('⛓️ Timestamping on blockchain...');
    const blockchainResult = await (0, BlockchainService_1.timestampReport)(aiResult.anonymizedContent);
    console.log('💾 Saving to database...');
    const report = await (0, DBService_1.saveReport)({
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
exports.getReports = (0, ErrorHandler_1.asyncHandler)(async (_req, res) => {
    const reports = await (0, DBService_1.getAllReports)();
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
//# sourceMappingURL=ReportController.js.map