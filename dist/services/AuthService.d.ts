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
export declare function createAdmin(input: CreateAdminInput): Promise<{
    id: number;
    createdAt: Date;
    email: string;
    firstName: string;
    lastName: string;
    position: string;
}>;
export declare function loginAdmin(input: LoginInput): Promise<{
    token: string;
    admin: AdminPayload;
}>;
export declare function verifyToken(token: string): AdminPayload;
export declare function getAdminById(id: number): Promise<{
    id: number;
    createdAt: Date;
    email: string;
    firstName: string;
    lastName: string;
    position: string;
    updatedAt: Date;
}>;
