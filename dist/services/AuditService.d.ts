export interface AuditLogInput {
    adminId: number;
    method: string;
    endpoint: string;
    params?: any;
    ipAddress: string;
    userAgent: string;
}
export declare function createAuditLog(input: AuditLogInput): Promise<{
    id: number;
    createdAt: Date;
    action: string;
    method: string;
    endpoint: string;
    params: string | null;
    ipAddress: string;
    userAgent: string;
    adminId: number;
}>;
export declare function getAuditLogs(page?: number, perPage?: number): Promise<{
    logs: ({
        admin: {
            id: number;
            email: string;
            firstName: string;
            lastName: string;
            position: string;
        };
    } & {
        id: number;
        createdAt: Date;
        action: string;
        method: string;
        endpoint: string;
        params: string | null;
        ipAddress: string;
        userAgent: string;
        adminId: number;
    })[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
}>;
export declare function getAuditLogsByAdmin(adminId: number, page?: number, perPage?: number): Promise<{
    logs: {
        id: number;
        createdAt: Date;
        action: string;
        method: string;
        endpoint: string;
        params: string | null;
        ipAddress: string;
        userAgent: string;
        adminId: number;
    }[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
}>;
