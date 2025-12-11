"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReportController_1 = require("../controllers/ReportController");
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'AeroChain Sentinel API',
    });
});
router.post('/reports', ReportController_1.submitReport);
router.get('/reports', ReportController_1.getReports);
router.get('/reports/:id', ReportController_1.getReport);
router.get('/reports/:id/verify', ReportController_1.verifyReport);
exports.default = router;
//# sourceMappingURL=index.js.map