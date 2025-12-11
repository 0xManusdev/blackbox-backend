"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.initDatabase = initDatabase;
exports.saveReport = saveReport;
exports.getAllReports = getAllReports;
exports.getReportById = getReportById;
exports.closePool = closePool;
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const prisma_1 = require("../../generated/prisma");
const config_1 = require("../config");
// Helper to map Prisma model to legacy interface
function mapToLegacy(r) {
    return {
        id: r.id,
        original_content: r.originalContent,
        anonymized_content: r.anonymizedContent,
        category: r.category,
        severity: r.severity,
        ai_analysis: r.aiAnalysis,
        content_hash: r.contentHash,
        blockchain_tx_hash: r.blockchainTxHash,
        created_at: r.createdAt,
    };
}
// Create pg Pool and Prisma adapter
const pool = new pg_1.Pool({ connectionString: config_1.config.databaseUrl });
const adapter = new adapter_pg_1.PrismaPg(pool);
// Prisma Client with adapter (required for Prisma 7)
const prisma = new prisma_1.PrismaClient({ adapter });
exports.prisma = prisma;
// Initialize database connection
async function initDatabase() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully (Prisma)');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}
// Save a new report to database
async function saveReport(report) {
    const created = await prisma.report.create({
        data: {
            originalContent: report.original_content,
            anonymizedContent: report.anonymized_content,
            category: report.category,
            severity: report.severity,
            aiAnalysis: report.ai_analysis,
            contentHash: report.content_hash,
            blockchainTxHash: report.blockchain_tx_hash,
        },
    });
    return mapToLegacy(created);
}
// Get all reports
async function getAllReports() {
    const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return reports.map(mapToLegacy);
}
// Get report by ID
async function getReportById(id) {
    const report = await prisma.report.findUnique({
        where: { id },
    });
    if (!report)
        return null;
    return mapToLegacy(report);
}
// Close Prisma connection
async function closePool() {
    await prisma.$disconnect();
    await pool.end();
}
//# sourceMappingURL=DBService.js.map