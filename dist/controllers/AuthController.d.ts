import { Request, Response } from 'express';
export declare function register(req: Request, res: Response): Promise<void>;
export declare function login(req: Request, res: Response): Promise<void>;
export declare function logout(req: Request, res: Response): Promise<void>;
export declare function getCurrentAdmin(req: Request, res: Response): Promise<void>;
export declare function getAuditLogsController(req: Request, res: Response): Promise<void>;
