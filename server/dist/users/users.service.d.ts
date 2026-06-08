import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: number): Promise<{
        id: number;
        username: string;
        role: string;
        avatar: string;
        bio: string;
        createdAt: Date;
    } | null>;
    updateProfile(id: number, data: {
        username?: string;
        avatar?: string;
        bio?: string;
    }): Promise<{
        id: number;
        username: string;
        role: string;
        avatar: string;
        bio: string;
        createdAt: Date;
    }>;
    changePassword(id: number, oldPassword: string, newPassword: string): Promise<void>;
    findAll(): Promise<{
        id: number;
        username: string;
        role: string;
        avatar: string;
        bio: string;
        createdAt: Date;
    }[]>;
}
//# sourceMappingURL=users.service.d.ts.map