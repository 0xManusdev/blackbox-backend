import { Zone } from '../../generated/prisma/enums';
export { Zone };
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
declare const prisma: import("../../generated/prisma/internal/class").PrismaClient<never, import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined, import("@prisma/client/runtime/client").DefaultArgs>;
export declare function initDatabase(): Promise<void>;
export declare function saveReport(input: CreateReportInput): Promise<Report>;
export declare function getAllReports(): Promise<Report[]>;
export declare function getReportById(id: number): Promise<Report | null>;
export declare function closePool(): Promise<void>;
export { prisma };
