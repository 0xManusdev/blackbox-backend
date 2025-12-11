"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.Zone = void 0;
exports.initDatabase = initDatabase;
exports.saveReport = saveReport;
exports.getAllReports = getAllReports;
exports.getReportById = getReportById;
exports.closePool = closePool;
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const config_1 = require("../config");
const client_2 = require("@prisma/client");
Object.defineProperty(exports, "Zone", { enumerable: true, get: function () { return client_2.Zone; } });
// Helper to map Prisma model to legacy interface
function mapToLegacy(r) {
    return {
        id: r.id,
        zone: r.zone,
        custom_zone: r.customZone,
        incident_time: r.incidentTime,
        description: r.description,
        anonymized_content: r.anonymizedContent,
        category: r.category,
        severity: r.severity,
        ai_analysis: r.aiAnalysis,
        content_hash: r.contentHash,
        blockchain_tx_hash: r.blockchainTxHash,
        attachments: r.attachments,
        created_at: r.createdAt,
    };
}
// Create pg Pool and Prisma adapter
const pool = new pg_1.Pool({ connectionString: config_1.config.databaseUrl });
const adapter = new adapter_pg_1.PrismaPg(pool);
// Prisma Client with adapter (required for Prisma 7)
const prisma = new client_1.PrismaClient({ adapter });
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
async function saveReport(input) {
    const created = await prisma.report.create({
        data: {
            zone: input.zone,
            customZone: input.customZone || null,
            incidentTime: input.incidentTime,
            description: input.description,
            anonymizedContent: input.anonymizedContent,
            category: input.category,
            severity: input.severity,
            aiAnalysis: input.aiAnalysis,
            contentHash: input.contentHash,
            blockchainTxHash: input.blockchainTxHash,
            attachments: input.attachments,
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