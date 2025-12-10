import { Router, Request, Response } from 'express';
import {
    submitReport,
    getReports,
    getReport,
    verifyReport,
} from '../controllers/ReportController';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'AeroChain Sentinel API',
    });
});

router.post('/reports', submitReport);
router.get('/reports', getReports);
router.get('/reports/:id', getReport);
router.get('/reports/:id/verify', verifyReport);

export default router;
