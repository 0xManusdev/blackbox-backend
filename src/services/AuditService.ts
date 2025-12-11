import { prisma } from './DBService';

export interface AuditLogInput {
    adminId: number;
    method: string;
    endpoint: string;
    params?: any;
    ipAddress: string;
    userAgent: string;
}

export async function createAuditLog(input: AuditLogInput) {
    const action = `${input.method} ${input.endpoint}`;

    const log = await prisma.auditLog.create({
        data: {
            adminId: input.adminId,
            action,
            method: input.method,
            endpoint: input.endpoint,
            params: input.params ? JSON.stringify(input.params) : null,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
        },
    });

    return log;
}

export async function getAuditLogs(page: number = 1, perPage: number = 50) {
    const skip = (page - 1) * perPage;

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            skip,
            take: perPage,
            orderBy: { createdAt: 'desc' },
            include: {
                admin: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        position: true,
                    },
                },
            },
        }),
        prisma.auditLog.count(),
    ]);

    return {
        logs,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
    };
}

export async function getAuditLogsByAdmin(adminId: number, page: number = 1, perPage: number = 50) {
    const skip = (page - 1) * perPage;

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where: { adminId },
            skip,
            take: perPage,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where: { adminId } }),
    ]);

    return {
        logs,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
    };
}
