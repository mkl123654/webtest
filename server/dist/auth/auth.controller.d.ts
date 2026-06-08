import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
}
//# sourceMappingURL=auth.controller.d.ts.map