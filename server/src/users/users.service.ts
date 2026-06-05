import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(
    id: number,
    data: { username?: string; avatar?: string; bio?: string },
  ) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('用户不存在');

    if (data.username && data.username !== user.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: data.username },
      });
      if (existing) throw new ConflictException('用户名已被占用');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.username && { username: data.username }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.bio !== undefined && { bio: data.bio }),
      },
      select: {
        id: true,
        username: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });
  }

  async changePassword(
    id: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new UnauthorizedException('原密码错误');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
      orderBy: { id: 'desc' },
    });
  }
}
