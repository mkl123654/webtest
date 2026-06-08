import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            username: string;
            role: string;
            avatar: string;
            bio: string;
            createdAt: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            username: string;
            role: string;
            avatar: string;
            bio: string;
            createdAt: string;
        };
    }>;
    private buildToken;
}
//# sourceMappingURL=auth.service.d.ts.map