import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findPublishedPosts(category?: string) {
    const where: any = { published: true };
    if (category) {
      where.categories = {
        some: { category: { key: { in: category.split(',').map((s: string) => s.trim()) } } },
      };
    }
    return this.prisma.post.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { categories: { include: { category: { include: { group: true } } } } },
    });
  }

  async search(q: string, category?: string) {
    const kw = q?.trim();
    if (!kw) return [];
    const where: any = {
      published: true,
      OR: [
        { title: { contains: kw } },
        { description: { contains: kw } },
      ],
    };
    if (category) {
      where.categories = {
        some: { category: { key: { in: category.split(',').map((s: string) => s.trim()) } } },
      };
    }
    return this.prisma.post.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { categories: { include: { category: { include: { group: true } } } } },
    });
  }

  async findPostById(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { categories: { include: { category: { include: { group: true } } } } },
    });
    if (!post) throw new NotFoundException('卡片不存在');
    return post;
  }

  async findPostDetail(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        categories: { include: { category: { include: { group: true } } } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });
    if (!post) throw new NotFoundException('卡片不存在');

    const commentMap = new Map<number, any>();
    const roots: any[] = [];

    for (const c of post.comments) {
      commentMap.set(c.id, { ...c, replies: [] });
    }
    for (const c of commentMap.values()) {
      if (c.parentId && commentMap.has(c.parentId)) {
        commentMap.get(c.parentId).replies.push(c);
      } else {
        roots.push(c);
      }
    }

    const { comments, ...postData } = post;
    return { ...postData, comments: roots };
  }

  // ========== Admin ==========

  async findAllPosts(params: { category?: string; published?: boolean }) {
    const where: any = {};
    if (params.published !== undefined) where.published = params.published;
    if (params.category) {
      where.categories = {
        some: { category: { key: { in: params.category.split(',').map((s: string) => s.trim()) } } },
      };
    }
    return this.prisma.post.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { categories: { include: { category: { include: { group: true } } } } },
    });
  }

  async createPost(data: {
    title: string;
    description: string;
    emoji: string;
    badge: string;
    published?: boolean;
    sortOrder?: number;
    content?: string;
    images?: string;
    categoryIds?: number[];
  }) {
    const { categoryIds, ...postData } = data;
    return this.prisma.post.create({
      data: {
        ...postData,
        ...(categoryIds?.length ? {
          categories: { create: categoryIds.map(id => ({ categoryId: id })) },
        } : {}),
      },
      include: { categories: { include: { category: true } } },
    });
  }

  async updatePost(
    id: number,
    data: {
      title?: string;
      description?: string;
      emoji?: string;
      badge?: string;
      published?: boolean;
      sortOrder?: number;
      content?: string;
      images?: string;
      categoryIds?: number[];
    },
  ) {
    await this.findPostById(id);
    const { categoryIds, ...postData } = data;
    if (categoryIds !== undefined) {
      await this.prisma.postCategory.deleteMany({ where: { postId: id } });
    }
    return this.prisma.post.update({
      where: { id },
      data: {
        ...postData,
        ...(categoryIds !== undefined ? {
          categories: { create: categoryIds.map(cid => ({ categoryId: cid })) },
        } : {}),
      },
      include: { categories: { include: { category: true } } },
    });
  }

  async deletePost(id: number) {
    await this.findPostById(id);
    return this.prisma.post.delete({ where: { id } });
  }

  async togglePublish(id: number) {
    const post = await this.findPostById(id);
    return this.prisma.post.update({
      where: { id },
      data: { published: !post.published },
      include: { categories: { include: { category: { include: { group: true } } } } },
    });
  }

  // ========== Comments ==========

  async createComment(postId: number, userId: number, data: { content: string; parentId?: number }) {
    await this.findPostById(postId);
    if (data.parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: data.parentId } });
      if (!parent || parent.postId !== postId) throw new NotFoundException('父评论不存在');
    }
    return this.prisma.comment.create({
      data: { content: data.content, postId, userId, parentId: data.parentId || null },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
  }

  async deleteComment(id: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('评论不存在');
    if (comment.userId !== userId) throw new ForbiddenException('只能删除自己的评论');
    return this.prisma.comment.delete({ where: { id } });
  }

  // ========== Ratings ==========

  async ratePost(postId: number, userId: number, score: number) {
    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      throw new ForbiddenException('评分必须在 1-5 之间');
    }
    await this.findPostById(postId);

    await this.prisma.rating.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId, score },
      update: { score },
    });

    const agg = await this.prisma.rating.aggregate({
      where: { postId },
      _avg: { score: true },
      _count: true,
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: {
        ratingAvg: agg._avg.score || 0,
        ratingCount: agg._count,
      },
    });

    return { ratingAvg: agg._avg.score || 0, ratingCount: agg._count };
  }

  async getUserRating(postId: number, userId: number) {
    const rating = await this.prisma.rating.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    return rating ? { score: rating.score } : { score: 0 };
  }

  // ========== Stats ==========

  async getStats() {
    const [pendingPosts, publishedPosts, userCount] = await Promise.all([
      this.prisma.post.count({ where: { published: false } }),
      this.prisma.post.count({ where: { published: true } }),
      this.prisma.user.count(),
    ]);
    return { pendingPosts, publishedPosts, userCount };
  }
}
