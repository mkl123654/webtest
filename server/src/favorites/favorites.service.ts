import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async list(userId: number, category?: string) {
    return this.prisma.favorite.findMany({
      where: {
        userId,
        ...(category ? { post: { section: { category } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: { section: true },
        },
      },
    });
  }

  async add(userId: number, postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('帖子不存在');

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existing) return existing;

    return this.prisma.favorite.create({
      data: { userId, postId },
      include: { post: { include: { section: true } } },
    });
  }

  async remove(userId: number, postId: number) {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (!fav) throw new NotFoundException('收藏记录不存在');
    return this.prisma.favorite.delete({ where: { id: fav.id } });
  }

  async check(userId: number, postIds: number[]) {
    if (!postIds.length) return {};
    const favs = await this.prisma.favorite.findMany({
      where: { userId, postId: { in: postIds } },
      select: { id: true, postId: true },
    });
    const map: Record<number, number> = {};
    favs.forEach(f => { map[f.postId] = f.id; });
    return map;
  }
}
