export interface TimestampResult {
    contentHash: string;
    txHash: string;
    blockNumber: number;
    timestamp: number;
}
export declare function hashContent(content: string): string;
export declare function timestampReport(content: string): Promise<TimestampResult>;
export declare function verifyTimestamp(txHash: string): Promise<{
    verified: boolean;
    contentHash: string | null;
    blockNumber: number | null;
}>;
