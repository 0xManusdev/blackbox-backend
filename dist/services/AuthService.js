"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdmin = createAdmin;
exports.loginAdmin = loginAdmin;
exports.verifyToken = verifyToken;
exports.getAdminById = getAdminById;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const DBService_1 = require("./DBService");
const config_1 = require("../config");
async function createAdmin(input) {
    const existingAdmin = await DBService_1.prisma.admin.findUnique({
        where: { email: input.email },
    });
    if (existingAdmin) {
        throw new Error('Un administrateur avec cet email existe déjà');
    }
    const hashedPassword = await bcryptjs_1.default.hash(input.password, 10);
    const admin = await DBService_1.prisma.admin.create({
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
async function loginAdmin(input) {
    const admin = await DBService_1.prisma.admin.findUnique({
        where: { email: input.email },
    });
    if (!admin) {
        throw new Error('Email ou mot de passe incorrect');
    }
    const isPasswordValid = await bcryptjs_1.default.compare(input.password, admin.password);
    if (!isPasswordValid) {
        throw new Error('Email ou mot de passe incorrect');
    }
    const payload = {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        position: admin.position,
    };
    const token = jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, {
        expiresIn: config_1.config.jwtExpiresIn,
    });
    return {
        token,
        admin: payload,
    };
}
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        return decoded;
    }
    catch (error) {
        throw new Error('Token invalide ou expiré');
    }
}
async function getAdminById(id) {
    const admin = await DBService_1.prisma.admin.findUnique({
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
//# sourceMappingURL=AuthService.js.map