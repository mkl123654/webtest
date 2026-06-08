import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<{
        id: number;
        username: string;
        role: string;
        avatar: string;
        bio: string;
        createdAt: Date;
    } | null>;
    updateMe(req: any, body: {
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
    changePassword(req: any, body: {
        oldPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
export declare class AdminUsersController {
    private usersService;
    constructor(usersService: UsersService);
    list(): Promise<{
        id: number;
        username: string;
        role: string;
        avatar: string;
        bio: string;
        createdAt: Date;
    }[]>;
}
//# sourceMappingURL=users.controller.d.ts.map