import { Request, Response, NextFunction } from 'express';
import { createAuditLog } from '../services/AuditService';

const METHODS_TO_LOG = ['POST', 'PUT', 'DELETE', 'PATCH'];

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!METHODS_TO_LOG.includes(req.method)) {
        next();
        return;
    }

    if (!req.admin) {
        next();
        return;
    }

    const originalSend = res.json;

    res.json = function (data: any) {
        if (res.statusCode >= 200 && res.statusCode < 400) {
            const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                              req.socket.remoteAddress || 
                              'unknown';
            
            const userAgent = req.headers['user-agent'] || 'unknown';

            const params: any = {};
            if (Object.keys(req.body).length > 0) params.body = req.body;
            if (Object.keys(req.params).length > 0) params.params = req.params;
            if (Object.keys(req.query).length > 0) params.query = req.query;

            createAuditLog({
                adminId: req.admin!.id,
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
