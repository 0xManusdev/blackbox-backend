import { Request, Response, NextFunction } from 'express';
import { AdminPayload } from '../services/AuthService';
declare global {
    namespace Express {
        interface Request {
            admin?: AdminPayload;
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
