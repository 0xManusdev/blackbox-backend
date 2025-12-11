import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Report as PrismaReport } from '@prisma/client';
import { config } from '../config';
import { Zone } from '@prisma/client';

// Re-export Zone enum for use in other files
export { Zone };

// Report interface (matches Prisma model but with snake_case for compatibility)
export interface Report {
    id?: number;
    zone: Zone;
    custom_zone?: string | null;
    incident_time: string;
    description: string;
    anonymized_content: string;
    category: string;
    severity: string;
    ai_analysis: string;
    content_hash: string;
    blockchain_tx_hash: string;
    attachments: string[];
    created_at?: Date;
}

// Input type for creating a report
export interface CreateReportInput {
    zone: Zone;
    customZone?: string;
    incidentTime: string;
    description: string;
    anonymizedContent: string;
    category: string;
    severity: string;
    aiAnalysis: string;
    contentHash: string;
    blockchainTxHash: string;
    attachments: string[];
}

// Helper to map Prisma model to legacy interface
function mapToLegacy(r: PrismaReport): Report {
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
const pool = new Pool({ connectionString: config.databaseUrl });
const adapter = new PrismaPg(pool);

// Prisma Client with adapter (required for Prisma 7)
const prisma = new PrismaClient({ adapter });

// Initialize database connection
export async function initDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully (Prisma)');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}

// Save a new report to database
export async function saveReport(input: CreateReportInput): Promise<Report> {
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
export async function getAllReports(): Promise<Report[]> {
    const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return reports.map(mapToLegacy);
}

// Get report by ID
export async function getReportById(id: number): Promise<Report | null> {
    const report = await prisma.report.findUnique({
        where: { id },
    });

    if (!report) return null;

    return mapToLegacy(report);
}

// Close Prisma connection
export async function closePool(): Promise<void> {
    await prisma.$disconnect();
    await pool.end();
}

// Export prisma client for direct access if needed
export { prisma };
