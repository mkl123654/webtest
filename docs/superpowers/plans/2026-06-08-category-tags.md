# 标签系统重构 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将硬编码三分类重构为多维度多对多标签系统

**Architecture:** CategoryGroup → Category → PostCategory ← Post，前端 TABS 从 `/categories` API 动态拉取

**Tech Stack:** Prisma 6 + NestJS 11 + Next.js 15

---

### Task 1: DB Migration — 建表 + 迁移旧数据

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/` (auto)

- [ ] **Step 1: 修改 Prisma Schema**

在 schema.prisma 中：

1. Section 模型删除 `category` 字段
2. Post 模型添加 `categories PostCategory[]` 关系
3. 新增 CategoryGroup / Category / PostCategory 三个模型

```prisma
model Section {
  id        Int      @id @default(autoincrement())
  title     String   @db.VarChar(50)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model CategoryGroup {
  id        Int        @id @default(autoincrement())
  key       String     @unique @db.VarChar(20)
  label     String     @db.VarChar(20)
  sortOrder Int        @default(0)
  categories Category[]
}

model Category {
  id        Int            @id @default(autoincrement())
  key       String         @unique @db.VarChar(20)
  label     String         @db.VarChar(20)
  icon      String         @db.VarChar(10)
  sortOrder Int            @default(0)
  groupId   Int
  group     CategoryGroup  @relation(fields: [groupId], references: [id], onDelete: Cascade)
  posts     PostCategory[]
}

model PostCategory {
  postId     Int
  categoryId Int
  post       Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([postId, categoryId])
}
```

Post 模型加一行：
```prisma
model Post {
  // ...existing fields...
  categories PostCategory[]
}
```

- [ ] **Step 2: 生成迁移**

Run: `cd server && npx prisma migrate dev --name add_category_tags`
Expected: 生成迁移文件，无错误

- [ ] **Step 3: 迁移旧数据**

手动 SQL 或在 seed 中执行：

```sql
-- 1. 创建默认分组
INSERT INTO CategoryGroup (key, label, sortOrder) VALUES ('type', '类型', 1);

-- 2. 创建现有标签
INSERT INTO Category (key, label, icon, sortOrder, groupId)
VALUES ('food', '美食', '🍽️', 1, 1),
       ('travel', '旅游', '✈️', 2, 1),
       ('fun', '游玩', '🎮', 3, 1);

-- 3. 根据 Section.category 关联 Post → Category
INSERT INTO PostCategory (postId, categoryId)
SELECT p.id, c.id
FROM Post p
JOIN Section s ON p.sectionId = s.id
JOIN Category c ON c.key = s.category;
```

Run with Prisma or raw SQL.

- [ ] **Step 4: Prisma Client 重新生成**

Run: `cd server && npx prisma generate`
Expected: 无错误

- [ ] **Step 5: 验证迁移**

Run: `cd server && npx ts-node -e "const {PrismaClient}=require('@prisma/client');new PrismaClient().categoryGroup.findMany({include:{categories:true}}).then(r=>console.log(JSON.stringify(r,null,2)))"`
Expected: 输出分组及标签

- [ ] **Step 6: Commit**

---

### Task 2: 后端 Categories 模块

**Files:**
- Create: `server/src/categories/categories.module.ts`
- Create: `server/src/categories/categories.service.ts`
- Create: `server/src/categories/categories.controller.ts`
- Create: `server/src/categories/admin-categories.controller.ts`
- Modify: `server/src/app.module.ts`

- [ ] **Step 1: 创建 CategoriesService**

```typescript
// server/src/categories/categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // 公开：获取所有分组及标签
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

  // 获取所有标签（打平）
  async findAll(groupKey?: string) {
    return this.prisma.category.findMany({
      where: groupKey ? { group: { key: groupKey } } : undefined,
      orderBy: [{ group: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: { group: true },
    });
  }

  // 管理端：分组 CRUD
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

  // 管理端：标签 CRUD
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
```

- [ ] **Step 2: 创建公开 Controller**

```typescript
// server/src/categories/categories.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async list(@Query('group') group?: string) {
    return this.categoriesService.findAllGroups(group);
  }
}
```

- [ ] **Step 3: 创建管理端 Controller**

```typescript
// server/src/categories/admin-categories.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminGuard } from '../posts/admin.guard';

@Controller('admin/category-groups')
@UseGuards(AdminGuard)
export class AdminCategoryGroupsController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async list() { return this.categoriesService.findAllGroups(); }

  @Post()
  async create(@Body() body: { key: string; label: string; sortOrder?: number }) {
    return this.categoriesService.createGroup(body);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: { key?: string; label?: string; sortOrder?: number }) {
    return this.categoriesService.updateGroup(id, body);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.deleteGroup(id);
    return { message: '分组已删除' };
  }
}

@Controller('admin/categories')
@UseGuards(AdminGuard)
export class AdminCategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async list(@Query('group') group?: string) {
    return this.categoriesService.findAll(group);
  }

  @Post()
  async create(@Body() body: { key: string; label: string; icon: string; groupId: number; sortOrder?: number }) {
    return this.categoriesService.createCategory(body);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.categoriesService.updateCategory(id, body);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.deleteCategory(id);
    return { message: '标签已删除' };
  }
}
```

- [ ] **Step 4: 创建 Module**

```typescript
// server/src/categories/categories.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { AdminCategoryGroupsController, AdminCategoriesController } from './admin-categories.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController, AdminCategoryGroupsController, AdminCategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
```

- [ ] **Step 5: 注册模块到 app.module.ts**

添加到 imports 数组：
```typescript
import { CategoriesModule } from './categories/categories.module';
// ...
imports: [/* existing */, CategoriesModule],
```

- [ ] **Step 6: 验证**

Run: `cd server && npx tsc --noEmit`
Expected: 零错误

Run: 启动 server，测试 `GET http://localhost:4000/categories`
Expected: 返回分组列表

- [ ] **Step 7: Commit**

---

### Task 3: 后端 Posts 适配多标签

**Files:**
- Modify: `server/src/posts/posts.service.ts`

- [ ] **Step 1: 修改 findAllPosts 支持 categories 参数**

在 `findAllPosts` 中：
```typescript
where: {
  ...existing,
  ...(params.categories ? {
    categories: {
      some: {
        category: {
          key: { in: params.categories.split(',').map((s: string) => s.trim()) }
        }
      }
    }
  } : {}),
}
```

- [ ] **Step 2: 修改 search 支持 categories 参数**

在 `search` 方法中：
```typescript
where: {
  published: true,
  ...(category ? {
    categories: {
      some: {
        category: {
          key: { in: category.split(',').map((s: string) => s.trim()) }
        }
      }
    }
  } : {}),
  OR: [...existing],
}
```

- [ ] **Step 3: 修改 findAllSections 去掉 category 参数**

`findAllSections` 不再接受 category 参数，直接返回所有 sections。

- [ ] **Step 4: Posts 查询结果 include categories**

在查询 posts 时 `include: { categories: { include: { category: { include: { group: true } } } }, section: true }`

- [ ] **Step 5: 修改 createPost / updatePost 支持 categoryIds**

```typescript
async createPost(data: { ..., categoryIds?: number[] }) {
  const { categoryIds, ...postData } = data;
  return this.prisma.post.create({
    data: {
      ...postData,
      ...(categoryIds ? {
        categories: {
          create: categoryIds.map(id => ({ categoryId: id }))
        }
      } : {}),
    },
    include: { section: true, categories: { include: { category: true } } },
  });
}

async updatePost(id: number, data: { ..., categoryIds?: number[] }) {
  const { categoryIds, ...postData } = data;
  if (categoryIds !== undefined) {
    await this.prisma.postCategory.deleteMany({ where: { postId: id } });
  }
  return this.prisma.post.update({
    where: { id },
    data: {
      ...postData,
      ...(categoryIds !== undefined ? {
        categories: {
          create: categoryIds.map(cid => ({ categoryId: cid }))
        }
      } : {}),
    },
    include: { section: true, categories: { include: { category: true } } },
  });
}
```

- [ ] **Step 6: 修改 favorites service 适配 categories 过滤**

`favorites.service.ts` list 方法中的 category 过滤改为：
```typescript
...(category ? {
  post: {
    categories: {
      some: {
        category: { key: category }
      }
    }
  }
} : {}),
```

- [ ] **Step 7: 验证**

Run: `cd server && npx tsc --noEmit`
Expected: 零错误

- [ ] **Step 8: Commit**

---

### Task 4: 前端动态 TABS

**Files:**
- Modify: `web/src/types/index.ts`
- Modify: `web/src/components/RecommendContent.tsx`
- Modify: `web/src/app/(main)/favorites/FavoritesContent.tsx`
- Modify: `web/src/app/[category]/[id]/page.tsx`

- [ ] **Step 1: 更新类型定义**

```typescript
// web/src/types/index.ts
export interface CategoryData {
  id: number;
  key: string;
  label: string;
  icon: string;
  sortOrder: number;
  group: { id: number; key: string; label: string };
}

export interface CategoryGroupData {
  id: number;
  key: string;
  label: string;
  categories: CategoryData[];
}
```

删除旧的 `TabKey` 类型。

- [ ] **Step 2: 修改 RecommendContent.tsx**

1. 删除 `TABS` 硬编码数组
2. 用 `useEffect` 调 `api.get<CategoryGroupData[]>('/categories')` 获取分组
3. 将所有标签打平展示为 TABS（按 sortOrder 排）
4. URL 参数改为 `?categories=food,shenzhen`
5. tab state 改为 `string`（逗号分隔的 category keys）
6. 传给 API 的查询参数改为 `categories`

- [ ] **Step 3: 修改 FavoritesContent.tsx**

1. 删除 `TABS` 硬编码数组
2. 改为动态拉取 `/categories`
3. URL 参数 `?categories=food`

- [ ] **Step 4: 修改 PostDetailPage**

1. 删除 `CAT_LABELS` / `CAT_EMOJIS` 硬编码
2. Post 详情中展示多个标签（从 `post.categories` 读取）

- [ ] **Step 5: 验证**

Run: `cd web && npx tsc --noEmit`
Expected: 零错误

- [ ] **Step 6: Commit**

---

### Task 5: 类型检查 + 全链路验证

- [ ] **Step 1: 后端编译检查**

Run: `cd server && npx tsc --noEmit`
Expected: 零错误

- [ ] **Step 2: 前端编译检查**

Run: `cd web && npx tsc --noEmit`
Expected: 零错误

- [ ] **Step 3: 启动验证**

1. 启动 server，GET /categories 返回数据
2. 启动 web，推荐页 TABS 动态渲染
3. 切换标签，筛选正常

- [ ] **Step 4: Commit**
