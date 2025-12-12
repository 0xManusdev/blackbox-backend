import { Request, Response } from 'express';
import { createAdmin, loginAdmin, getAdminById } from '../services/AuthService';
import { getAuditLogs } from '../services/AuditService';

export async function register(req: Request, res: Response) {
    try {
        const { firstName, lastName, email, password, position } = req.body;

        if (!firstName || !lastName || !email || !password || !position) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Tous les champs sont requis',
            });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Email invalide',
            });
            return;
        }

        if (password.length < 8) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Le mot de passe doit contenir au moins 8 caractères',
            });
            return;
        }

        const admin = await createAdmin({
            firstName,
            lastName,
            email,
            password,
            position,
        });

        res.status(201).json({
            success: true,
            message: 'Administrateur créé avec succès',
            data: admin,
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(400).json({
            success: false,
            error: 'Registration failed',
            message: error instanceof Error ? error.message : 'Erreur lors de la création',
        });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Email et mot de passe requis',
            });
            return;
        }

        const { token, admin } = await loginAdmin({ email, password });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });

        res.json({
            success: true,
            message: 'Connexion réussie',
            data: {
                admin,
                token,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            success: false,
            error: 'Authentication failed',
            message: error instanceof Error ? error.message : 'Erreur lors de la connexion',
        });
    }
}

export async function logout(req: Request, res: Response) {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.json({
        success: true,
        message: 'Déconnexion réussie',
    });
}

export async function getCurrentAdmin(req: Request, res: Response) {
    try {
        if (!req.admin) {
            res.status(401).json({
                success: false,
                error: 'Non autorisé',
                message: 'Administrateur non authentifié',
            });
            return;
        }

        const admin = await getAdminById(req.admin.id);

        res.json({
            success: true,
            data: admin,
        });
    } catch (error) {
        console.error('Get current admin error:', error);
        res.status(404).json({
            success: false,
            error: 'Not found',
            message: error instanceof Error ? error.message : 'Administrateur non trouvé',
        });
    }
}

export async function getAuditLogsController(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const perPage = parseInt(req.query.perPage as string) || 50;

        const result = await getAuditLogs(page, perPage);

        res.json({
            success: true,
            data: result.logs,
            pagination: {
                page: result.page,
                perPage: result.perPage,
                total: result.total,
                totalPages: result.totalPages,
            },
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Erreur lors de la récupération des logs',
        });
    }
}
