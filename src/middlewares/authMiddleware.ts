import { Request, Response, NextFunction } from 'express';
import { verifyToken, AdminPayload } from '../services/AuthService';

declare global {
    namespace Express {
        interface Request {
            admin?: AdminPayload;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.token;

        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Non autorisé',
                message: 'Aucun token d\'authentification fourni',
            });
            return;
        }

        const admin = verifyToken(token);
        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Non autorisé',
            message: error instanceof Error ? error.message : 'Token invalide',
        });
    }
}
