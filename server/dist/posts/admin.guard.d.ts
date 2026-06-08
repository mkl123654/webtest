import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
export declare class AdminGuard extends JwtAuthGuard {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=admin.guard.d.ts.map