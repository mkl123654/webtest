import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // ===== 公开接口 =====

  async findAllGroups(groupKey?: string) {
    return this.prisma.categoryGroup.findMany({
      where: groupKey ? { key: groupKey } : undefined,
      orderBy: { sortOrder: 'asc' },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findAll(groupKey?: string) {
    return this.prisma.category.findMany({
      where: groupKey ? { group: { key: groupKey } } : undefined,
      orderBy: [{ group: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: { group: true },
    });
  }

  // ===== 管理端：分组 CRUD =====

  async createGroup(data: { key: string; label: string; sortOrder?: number }) {
    return this.prisma.categoryGroup.create({ data });
  }

  async updateGroup(id: number, data: { key?: string; label?: string; sortOrder?: number }) {
    await this.findGroupOrFail(id);
    return this.prisma.categoryGroup.update({ where: { id }, data });
  }

  async deleteGroup(id: number) {
    await this.findGroupOrFail(id);
    return this.prisma.categoryGroup.delete({ where: { id } });
  }

  private async findGroupOrFail(id: number) {
    const g = await this.prisma.categoryGroup.findUnique({ where: { id } });
    if (!g) throw new NotFoundException('分组不存在');
    return g;
  }

  // ===== 管理端：标签 CRUD =====

  async createCategory(data: { key: string; label: string; icon: string; groupId: number; sortOrder?: number }) {
    return this.prisma.category.create({ data, include: { group: true } });
  }

  async updateCategory(id: number, data: { key?: string; label?: string; icon?: string; groupId?: number; sortOrder?: number }) {
    await this.findCategoryOrFail(id);
    return this.prisma.category.update({ where: { id }, data, include: { group: true } });
  }

  async deleteCategory(id: number) {
    await this.findCategoryOrFail(id);
    return this.prisma.category.delete({ where: { id } });
  }

  private async findCategoryOrFail(id: number) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('标签不存在');
    return c;
  }
}
