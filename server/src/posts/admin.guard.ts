import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authed = await super.canActivate(context);
    if (!authed) return false;

    const request = context.switchToHttp().getRequest();
    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException('需要管理员权限');
    }
    return true;
  }
}
