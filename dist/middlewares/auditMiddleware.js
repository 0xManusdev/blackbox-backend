"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMiddleware = auditMiddleware;
const AuditService_1 = require("../services/AuditService");
const METHODS_TO_LOG = ['POST', 'PUT', 'DELETE', 'PATCH'];
function auditMiddleware(req, res, next) {
    if (!METHODS_TO_LOG.includes(req.method)) {
        next();
        return;
    }
    if (!req.admin) {
        next();
        return;
    }
    const originalSend = res.json;
    res.json = function (data) {
        if (res.statusCode >= 200 && res.statusCode < 400) {
            const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
                req.socket.remoteAddress ||
                'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            const params = {};
            if (Object.keys(req.body).length > 0)
                params.body = req.body;
            if (Object.keys(req.params).length > 0)
                params.params = req.params;
            if (Object.keys(req.query).length > 0)
                params.query = req.query;
            (0, AuditService_1.createAuditLog)({
                adminId: req.admin.id,
                method: req.method,
                endpoint: req.originalUrl || req.url,
                params: Object.keys(params).length > 0 ? params : undefined,
                ipAddress,
                userAgent,
            }).catch((error) => {
                console.error('Failed to create audit log:', error);
            });
        }
        return originalSend.call(this, data);
    };
    next();
}
//# sourceMappingURL=auditMiddleware.js.map