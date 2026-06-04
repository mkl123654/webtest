import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: number): Promise<{
        username: string;
        id: number;
        role: string;
        createdAt: Date;
    } | null>;
}
//# sourceMappingURL=users.service.d.ts.map