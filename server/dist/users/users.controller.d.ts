import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<{
        username: string;
        id: number;
        role: string;
        createdAt: Date;
    } | null>;
}
//# sourceMappingURL=users.controller.d.ts.map