import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './DBService';
import { config } from '../config';

export interface AdminPayload {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    position: string;
}

export interface CreateAdminInput {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    position: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export async function createAdmin(input: CreateAdminInput) {
    const existingAdmin = await prisma.admin.findUnique({
        where: { email: input.email },
    });

    if (existingAdmin) {
        throw new Error('Un administrateur avec cet email existe déjà');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const admin = await prisma.admin.create({
        data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            password: hashedPassword,
            position: input.position,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            createdAt: true,
        },
    });

    return admin;
}

export async function loginAdmin(input: LoginInput) {
    const admin = await prisma.admin.findUnique({
        where: { email: input.email },
    });

    if (!admin) {
        throw new Error('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(input.password, admin.password);

    if (!isPasswordValid) {
        throw new Error('Email ou mot de passe incorrect');
    }

    const payload: AdminPayload = {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        position: admin.position,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn as string,
    } as jwt.SignOptions);

    return {
        token,
        admin: payload,
    };
}

export function verifyToken(token: string): AdminPayload {
    try {
        const decoded = jwt.verify(token, config.jwtSecret) as AdminPayload;
        return decoded;
    } catch (error) {
        throw new Error('Token invalide ou expiré');
    }
}

export async function getAdminById(id: number) {
    const admin = await prisma.admin.findUnique({
        where: { id },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!admin) {
        throw new Error('Administrateur non trouvé');
    }

    return admin;
}
