"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
exports.getAuditLogs = getAuditLogs;
exports.getAuditLogsByAdmin = getAuditLogsByAdmin;
const DBService_1 = require("./DBService");
async function createAuditLog(input) {
    const action = `${input.method} ${input.endpoint}`;
    const log = await DBService_1.prisma.auditLog.create({
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
async function getAuditLogs(page = 1, perPage = 50) {
    const skip = (page - 1) * perPage;
    const [logs, total] = await Promise.all([
        DBService_1.prisma.auditLog.findMany({
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
        DBService_1.prisma.auditLog.count(),
    ]);
    return {
        logs,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
    };
}
async function getAuditLogsByAdmin(adminId, page = 1, perPage = 50) {
    const skip = (page - 1) * perPage;
    const [logs, total] = await Promise.all([
        DBService_1.prisma.auditLog.findMany({
            where: { adminId },
            skip,
            take: perPage,
            orderBy: { createdAt: 'desc' },
        }),
        DBService_1.prisma.auditLog.count({ where: { adminId } }),
    ]);
    return {
        logs,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
    };
}
//# sourceMappingURL=AuditService.js.map