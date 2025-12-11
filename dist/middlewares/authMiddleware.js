"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const AuthService_1 = require("../services/AuthService");
function authMiddleware(req, res, next) {
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
        const admin = (0, AuthService_1.verifyToken)(token);
        req.admin = admin;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Non autorisé',
            message: error instanceof Error ? error.message : 'Token invalide',
        });
    }
}
//# sourceMappingURL=authMiddleware.js.map