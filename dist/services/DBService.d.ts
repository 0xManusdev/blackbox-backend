export interface Report {
    id?: number;
    original_content: string;
    anonymized_content: string;
    category: string;
    severity: string;
    ai_analysis: string;
    content_hash: string;
    blockchain_tx_hash: string;
    created_at?: Date;
}
declare const prisma: any;
export declare function initDatabase(): Promise<void>;
export declare function saveReport(report: Omit<Report, 'id' | 'created_at'>): Promise<Report>;
export declare function getAllReports(): Promise<Report[]>;
export declare function getReportById(id: number): Promise<Report | null>;
export declare function closePool(): Promise<void>;
export { prisma };
