import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  // ========== Sections ==========

  async findAllSections(category?: string) {
    return this.prisma.section.findMany({
      where: category ? { category } : undefined,
      orderBy: { sortOrder: 'asc' },
      include: {
        posts: {
          where: { published: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async search(q: string, category?: string) {
    const kw = q?.trim();
    if (!kw) return [];
    return this.prisma.post.findMany({
      where: {
        published: true,
        ...(category ? { section: { category } } : {}),
        OR: [
          { title: { contains: kw } },
          { description: { contains: kw } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
      include: { section: true },
    });
  }

  async createSection(data: { title: string; category: string; sortOrder?: number }) {
    return this.prisma.section.create({ data });
  }

  async updateSection(id: number, data: { title?: string; category?: string; sortOrder?: number }) {
    await this.findSectionOrFail(id);
    return this.prisma.section.update({ where: { id }, data });
  }

  async deleteSection(id: number) {
    await this.findSectionOrFail(id);
    return this.prisma.section.delete({ where: { id } });
  }

  private async findSectionOrFail(id: number) {
    const section = await this.prisma.section.findUnique({ where: { id } });
    if (!section) throw new NotFoundException('栏目不存在');
    return section;
  }

  // ========== Posts ==========

  async findAllPosts(params: { category?: string; published?: boolean; sectionId?: number }) {
    const where: any = {};
    if (params.published !== undefined) where.published = params.published;
    if (params.sectionId) where.sectionId = params.sectionId;
    if (params.category) where.section = { category: params.category };

    return this.prisma.post.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { section: true },
    });
  }

  async findPostById(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { section: true },
    });
    if (!post) throw new NotFoundException('卡片不存在');
    return post;
  }

  async findPostDetail(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        section: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });
    if (!post) throw new NotFoundException('卡片不存在');

    // Build comment tree
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

  async createPost(data: {
    title: string;
    description: string;
    emoji: string;
    badge: string;
    sectionId: number;
    published?: boolean;
    sortOrder?: number;
    content?: string;
    images?: string;
  }) {
    return this.prisma.post.create({
      data,
      include: { section: true },
    });
  }

  async updatePost(
    id: number,
    data: {
      title?: string;
      description?: string;
      emoji?: string;
      badge?: string;
      sectionId?: number;
      published?: boolean;
      sortOrder?: number;
      content?: string;
      images?: string;
    },
  ) {
    await this.findPostById(id);
    return this.prisma.post.update({
      where: { id },
      data,
      include: { section: true },
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
      include: { section: true },
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

    // Recalculate average
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
