import { Injectable, NotFoundException } from '@nestjs/common';
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

  async createPost(data: {
    title: string;
    description: string;
    emoji: string;
    badge: string;
    sectionId: number;
    published?: boolean;
    sortOrder?: number;
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
