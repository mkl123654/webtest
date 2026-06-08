# 布局重构 & 收藏功能 — 实现计划

> **For agentic workers:** 按任务顺序执行，每步 checkbox。使用 `superpowers:executing-plans` 或 `superpowers:subagent-driven-development`。

**Goal:** 重构胖喵推荐平台整体布局（左侧功能菜单 + Tab 整合分类 + 收藏功能）

**Architecture:** Next.js Route Group `(main)/` 统一布局，NestJS 新增 Favorites 模块，Prisma 新增 Favorite 模型

**Tech Stack:** NestJS 11 + Prisma 6 + MySQL | Next.js 15 + React 19 | JWT

---

### 任务概览

| # | 任务 | 层 |
|---|------|----|
| 1 | Prisma Favorite 模型 + 迁移 | 后端 |
| 2 | Favorites 模块（Service + Controller + Module） | 后端 |
| 3 | 注册 FavoritesModule + 编译检查 | 后端 |
| 4 | 创建 `(main)/` Route Group 布局 | 前端 |
| 5 | LeftPanel 菜单重构 | 前端 |
| 6 | RecommendContent 组件（Tab + 搜索 + 分区列表） | 前端 |
| 7 | 胖喵推荐首页 `(main)/page.tsx` | 前端 |
| 8 | GalleryCard 添加收藏按钮 | 前端 |
| 9 | 个人收藏页 `(main)/favorites/page.tsx` | 前端 |
| 10 | 个人设置页 `(main)/settings/page.tsx` | 前端 |
| 11 | 移动端底部 TabBar + CSS 追加 | 前端 |
| 12 | 清理旧文件 + 全量编译检查 | 前端 |

---

### Task 1: Prisma Favorite 模型 + 迁移

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: 添加 Favorite 模型和关系**

在 `schema.prisma` 末尾追加 Favorite 模型，同时在 User 和 Post 模型追加反向关系。

**User 模型追加**（在 `ratings   Rating[]` 后加一行）:
```prisma
  favorites  Favorite[]
```

**Post 模型追加**（在 `ratings     Rating[]` 后加一行）:
```prisma
  favorites   Favorite[]
```

**在文件末尾追加 Favorite 模型**:
```prisma
model Favorite {
  id        Int      @id @default(autoincrement())
  userId    Int
  postId    Int
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@index([userId])
}
```

- [ ] **Step 2: 运行 Prisma 迁移**

```bash
cd d:/webtest/server && npx prisma migrate dev --name add_favorites
```

- [ ] **Step 3: 生成 Prisma Client**

```bash
cd d:/webtest/server && npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
cd d:/webtest && git add server/prisma/schema.prisma server/prisma/migrations/ && git commit -m "feat: 添加 Favorite 模型 — 用户收藏帖子"
```

---

### Task 2: Favorites 模块

**Files:**
- Create: `server/src/favorites/favorites.service.ts`
- Create: `server/src/favorites/favorites.controller.ts`
- Create: `server/src/favorites/favorites.module.ts`

- [ ] **Step 1: 创建 FavoritesService**

新建 `server/src/favorites/favorites.service.ts`:

```typescript
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
```

- [ ] **Step 2: 创建 FavoritesController**

新建 `server/src/favorites/favorites.controller.ts`:

```typescript
import {
  Controller, Get, Post, Delete, Body, Query, Request,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  async list(@Request() req: any, @Query('category') category?: string) {
    return this.favoritesService.list(req.user.id, category);
  }

  @Post()
  async add(@Request() req: any, @Body() body: { postId: number }) {
    return this.favoritesService.add(req.user.id, body.postId);
  }

  @Delete()
  async remove(
    @Request() req: any,
    @Query('postId', ParseIntPipe) postId: number,
  ) {
    return this.favoritesService.remove(req.user.id, postId);
  }

  @Get('check')
  async check(@Request() req: any, @Query('postIds') postIds?: string) {
    const ids = postIds ? postIds.split(',').map(Number).filter(n => !isNaN(n)) : [];
    return this.favoritesService.check(req.user.id, ids);
  }
}
```

- [ ] **Step 3: 创建 FavoritesModule**

新建 `server/src/favorites/favorites.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
```

- [ ] **Step 4: Commit**

```bash
cd d:/webtest && git add server/src/favorites/ && git commit -m "feat: Favorites 模块 — GET/POST/DELETE /favorites"
```

---

### Task 3: 注册模块 + 编译检查

**Files:**
- Modify: `server/src/app.module.ts`

- [ ] **Step 1: 在 AppModule 注册 FavoritesModule**

修改 `server/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { FavoritesModule } from './favorites/favorites.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, PostsModule, FavoritesModule],
})
export class AppModule {}
```

- [ ] **Step 2: TypeScript 编译检查**

```bash
cd d:/webtest/server && npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd d:/webtest && git add server/src/app.module.ts && git commit -m "feat: 注册 FavoritesModule"
```

---

### Task 4: 创建 `(main)/` Route Group 布局

**Files:**
- Create: `web/src/app/(main)/layout.tsx`

- [ ] **Step 1: 创建共享布局**

新建 `web/src/app/(main)/layout.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LeftPanel } from '@/components/LeftPanel';
import { ChatFloat } from '@/components/ChatFloat';

function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="mobile-tabbar">
      <button
        className={`mobile-tabbar-item ${pathname === '/' ? 'active' : ''}`}
        onClick={() => router.push('/')}
      >
        <span className="mobile-tabbar-icon">🐱</span>
        <span className="mobile-tabbar-label">推荐</span>
      </button>
      <button
        className={`mobile-tabbar-item ${pathname.startsWith('/favorites') ? 'active' : ''}`}
        onClick={() => router.push('/favorites')}
      >
        <span className="mobile-tabbar-icon">⭐</span>
        <span className="mobile-tabbar-label">收藏</span>
      </button>
      <button
        className={`mobile-tabbar-item ${pathname.startsWith('/settings') ? 'active' : ''}`}
        onClick={() => router.push('/settings')}
      >
        <span className="mobile-tabbar-icon">⚙️</span>
        <span className="mobile-tabbar-label">设置</span>
      </button>
    </nav>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#b8a088', fontSize: 16, fontFamily: 'var(--font-source-sans), sans-serif' }}>加载中…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app">
      <LeftPanel />
      <main className="right-panel">
        {children}
      </main>
      <ChatFloat />
      <MobileTabBar />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd d:/webtest && git add web/src/app/\(main\)/ && git commit -m "feat: (main) Route Group 共享布局 — 认证守卫 + LeftPanel + ChatFloat"
```

---

### Task 5: LeftPanel 菜单重构

**Files:**
- Modify: `web/src/components/LeftPanel.tsx`

- [ ] **Step 1: 用 Link 导航替换分类 Tab**

完全重写 `web/src/components/LeftPanel.tsx`:

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function LeftPanel() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <aside className="left-panel" id="leftPanel">
      <div className="profile-section">
        <div className="avatar-wrap" ref={dropdownRef}>
          <div
            className="avatar-main"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ cursor: 'pointer' }}
          >
            {user?.avatar || '🐱'}
          </div>
          <div className="avatar-status" />

          {dropdownOpen && (
            <div className="avatar-dropdown">
              <div className="dropdown-avatar">{user?.avatar || '🐱'}</div>
              <div className="dropdown-name">{user?.username}</div>
              <div className="dropdown-id">ID: {user?.id}</div>
              <div className="dropdown-bio">{user?.bio || '这个人很懒，什么都没写…'}</div>
              <div className="dropdown-actions">
                <button className="dropdown-btn logout" onClick={handleLogout}>
                  🚪 退出
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="profile-name">{user?.username || '胖喵'}</div>
        <div className="profile-tagline">吃货 · 旅行达人</div>
      </div>

      <nav className="nav-tabs">
        <Link
          href="/"
          className={`nav-tab ${isActive('/') ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <span className="tab-icon">🐱</span> 胖喵推荐
          <span className="tab-arrow">→</span>
        </Link>
        <Link
          href="/favorites"
          className={`nav-tab ${isActive('/favorites') ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <span className="tab-icon">⭐</span> 个人收藏
          <span className="tab-arrow">→</span>
        </Link>
        <Link
          href="/settings"
          className={`nav-tab ${isActive('/settings') ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <span className="tab-icon">⚙️</span> 个人设置
          <span className="tab-arrow">→</span>
        </Link>
      </nav>
    </aside>
  );
}
```

关键变更:
- 移除 `Props` 接口（无 props）
- 移除 `onTabChange` 回调
- 三个分类 Tab 替换为三个 Link 菜单项
- 去掉 `📂 推荐分类` 标签
- 下拉卡片移除"设置"按钮（已在菜单中）
- 使用 `usePathname()` 判断高亮

- [ ] **Step 2: Commit**

```bash
cd d:/webtest && git add web/src/components/LeftPanel.tsx && git commit -m "refactor: LeftPanel 菜单重构 — 功能导航 Link 替换分类 Tab"
```

---

### Task 6: RecommendContent 组件

**Files:**
- Create: `web/src/components/RecommendContent.tsx`

- [ ] **Step 1: 创建 RecommendContent**

新建 `web/src/components/RecommendContent.tsx`，从 RightPanel 提取内容逻辑，加上分类 Tab 和搜索栏上方布局：

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GallerySection } from './GallerySection';
import { GalleryCard } from './GalleryCard';
import { api } from '@/lib/api';

interface PostItem {
  id: number;
  title: string;
  description: string;
  emoji: string;
  badge: string;
  published: boolean;
  sortOrder: number;
  sectionId: number;
  section?: { id: number; title: string; category: string };
}

interface SectionData {
  id: number;
  title: string;
  category: string;
  sortOrder: number;
  posts: PostItem[];
}

const TABS = [
  { key: 'food', icon: '🍽️', label: '美食推荐' },
  { key: 'travel', icon: '✈️', label: '旅游推荐' },
  { key: 'fun', icon: '🎮', label: '游玩推荐' },
] as const;

const tabMeta: Record<string, { title: string; desc: string; placeholder: string }> = {
  food:  { title: '🍽️ 美食推荐', desc: '从街头小吃到精致料理，找到你的下一顿', placeholder: '搜美食、饮品…' },
  travel:{ title: '✈️ 旅游推荐', desc: '周末去哪、小长假去哪，帮你安排明白', placeholder: '搜目的地、玩法…' },
  fun:   { title: '🎮 游玩推荐', desc: '聚会、约会、一个人，都有好去处', placeholder: '搜聚会、体验、娱乐…' },
};

export function RecommendContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get('tab') as 'food' | 'travel' | 'fun') || 'food';

  const data = tabMeta[tab];
  const [sections, setSections] = useState<SectionData[]>([]);

  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<PostItem[]>([]);

  const [favMap, setFavMap] = useState<Record<number, number>>({});

  // 加载分类数据
  useEffect(() => {
    if (searchKeyword) return;
    api.get<SectionData[]>(`/sections?category=${tab}`)
      .then(setSections)
      .catch(() => setSections([]));
  }, [tab, searchKeyword]);

  // 切换 Tab
  const switchTab = useCallback((key: string) => {
    setSearchInput('');
    setSearchKeyword('');
    setSearchResults([]);
    router.push(`/?tab=${key}`, { scroll: false });
  }, [router]);

  // 搜索
  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    setSearchKeyword(q);
    api.get<PostItem[]>(`/search?q=${encodeURIComponent(q)}`)
      .then(setSearchResults)
      .catch(() => setSearchResults([]));
  };

  const handleClear = () => {
    setSearchInput('');
    setSearchKeyword('');
    setSearchResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="recommend-content">
      {/* 搜索栏 — 最上方 */}
      <div className="recommend-search">
        <div className="tab-search" style={{ maxWidth: 640, margin: '0 auto' }}>
          <input
            type="text"
            className="tab-search-input"
            placeholder="搜美食、饮品、目的地、玩法…"
            maxLength={200}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="tab-search-btn" onClick={handleSearch}>搜索</button>
          {searchKeyword && (
            <button className="tab-search-btn" onClick={handleClear} style={{ background: 'var(--taupe)' }}>
              清除
            </button>
          )}
        </div>
      </div>

      {/* 分类 Tab */}
      <div className="category-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`category-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => switchTab(t.key)}
          >
            <span className="category-tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="recommend-body">
        {searchKeyword ? (
          searchResults.length > 0 ? (
            <GallerySection
              title={`🔍 搜索结果："${searchKeyword}"（${searchResults.length} 个）`}
              items={searchResults.map(p => ({
                badge: p.badge,
                emoji: p.emoji,
                name: p.title,
                desc: p.description,
                postId: p.id,
                category: p.section?.category || '',
                isFavorited: !!favMap[p.id],
                favoriteId: favMap[p.id],
              }))}
            />
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--taupe)', marginTop: 40, fontSize: 14 }}>
              没有找到与 "{searchKeyword}" 相关的内容，换个关键词试试
            </p>
          )
        ) : (
          sections.map((section) => (
            <GallerySection
              key={section.id}
              title={section.title}
              items={section.posts.map((p) => ({
                badge: p.badge,
                emoji: p.emoji,
                name: p.title,
                desc: p.description,
                postId: p.id,
                category: section.category,
                isFavorited: !!favMap[p.id],
                favoriteId: favMap[p.id],
              }))}
            />
          ))
        )}

        {!searchKeyword && (
          <footer className="footer">
            © 2026 胖喵 · 前端开发者
          </footer>
        )}
      </div>
    </div>
  );
}
```

> **注**: 收藏状态加载 (favMap) 将在后续 GalleryCard 重构后完善。当前先传入 `isFavorited` / `favoriteId` props，GalleryCard 内部处理。

- [ ] **Step 2: Commit**

```bash
cd d:/webtest && git add web/src/components/RecommendContent.tsx && git commit -m "feat: RecommendContent — Tab 切换 + 搜索 + 分区列表"
```

---

### Task 7: 胖喵推荐首页

**Files:**
- Create: `web/src/app/(main)/page.tsx`

- [ ] **Step 1: 创建首页**

新建 `web/src/app/(main)/page.tsx`:

```typescript
import { Suspense } from 'react';
import { RecommendContent } from '@/components/RecommendContent';

export default function HomePage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--taupe)' }}>加载中…</div>
    }>
      <RecommendContent />
    </Suspense>
  );
}
```

> 用 `Suspense` 包裹是因为 `RecommendContent` 内部使用了 `useSearchParams()`。

- [ ] **Step 2: Commit**

```bash
cd d:/webtest && git add web/src/app/\(main\)/page.tsx && git commit -m "feat: 胖喵推荐首页 — Suspense + RecommendContent"
```

---

### Task 8: GalleryCard 添加收藏按钮

**Files:**
- Modify: `web/src/components/GalleryCard.tsx`
- Modify: `web/src/components/GallerySection.tsx`

- [ ] **Step 1: 修改 GallerySection 传递收藏相关 props**

修改 `web/src/components/GallerySection.tsx`，items 接口增加可选收藏字段并传递给 GalleryCard:

```typescript
import { GalleryCard } from './GalleryCard';

interface Props {
  title: string;
  items: {
    badge: string;
    emoji: string;
    name: string;
    desc: string;
    postId: number;
    category: string;
    isFavorited?: boolean;
    favoriteId?: number;
  }[];
}

export function GallerySection({ title, items }: Props) {
  return (
    <div className="gallery-section">
      <h3 className="section-title">{title}</h3>
      <div className="gallery">
        {items.map((item, i) => (
          <GalleryCard
            key={item.postId}
            badge={item.badge}
            emoji={item.emoji}
            name={item.name}
            desc={item.desc}
            index={i}
            postId={item.postId}
            category={item.category}
            isFavorited={item.isFavorited}
            favoriteId={item.favoriteId}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 重写 GalleryCard 加收藏按钮**

重写 `web/src/components/GalleryCard.tsx`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Props {
  badge: string;
  emoji: string;
  name: string;
  desc: string;
  index: number;
  postId: number;
  category: string;
  isFavorited?: boolean;
  favoriteId?: number;
}

export function GalleryCard({ badge, emoji, name, desc, index, postId, category, isFavorited = false, favoriteId }: Props) {
  const [fav, setFav] = useState(isFavorited);
  const [animating, setAnimating] = useState(false);

  const toggleFav = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    try {
      if (fav) {
        await api.del(`/favorites?postId=${postId}`);
        setFav(false);
      } else {
        await api.post('/favorites', { postId });
        setFav(true);
      }
    } catch (err) {
      // silently fail — user stays logged in check via middleware
    }
    setTimeout(() => setAnimating(false), 300);
  }, [fav, postId]);

  return (
    <Link href={`/${category}/${postId}`} className="gallery-card" style={{ textDecoration: 'none', position: 'relative' }}>
      <div className="img" style={{ '--i': index } as React.CSSProperties}>
        <span className="badge">{badge}</span>
        <button
          className={`fav-btn ${fav ? 'active' : ''} ${animating ? 'pop' : ''}`}
          onClick={toggleFav}
          aria-label={fav ? '取消收藏' : '收藏'}
          title={fav ? '取消收藏' : '收藏'}
        >
          {fav ? '❤️' : '♡'}
        </button>
        {emoji}
      </div>
      <div className="caption">
        {name}
        <small>{desc}</small>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd d:/webtest && git add web/src/components/GalleryCard.tsx web/src/components/GallerySection.tsx && git commit -m "feat: GalleryCard 收藏按钮 — ♡/❤️ 心形 toggle"
```

---

### Task 9: 个人收藏页

**Files:**
- Create: `web/src/app/(main)/favorites/page.tsx`
- Create: `web/src/app/(main)/favorites/FavoritesContent.tsx`

- [ ] **Step 1: 创建收藏页**

新建 `web/src/app/(main)/favorites/page.tsx`:

```typescript
import { Suspense } from 'react';
import { FavoritesContent } from './FavoritesContent';

export default function FavoritesPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--taupe)' }}>加载中…</div>
    }>
      <FavoritesContent />
    </Suspense>
  );
}
```

**同时新建** `web/src/app/(main)/favorites/FavoritesContent.tsx`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GallerySection } from '@/components/GallerySection';
import { api } from '@/lib/api';

interface FavoriteItem {
  id: number;
  postId: number;
  post: {
    id: number;
    title: string;
    description: string;
    emoji: string;
    badge: string;
    section: { id: number; title: string; category: string };
  };
}

const TABS = [
  { key: '', icon: '📋', label: '全部' },
  { key: 'food', icon: '🍽️', label: '美食' },
  { key: 'travel', icon: '✈️', label: '旅游' },
  { key: 'fun', icon: '🎮', label: '游玩' },
];

export function FavoritesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category') || '';

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(() => {
    setLoading(true);
    const query = category ? `?category=${category}` : '';
    api.get<FavoriteItem[]>(`/favorites${query}`)
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const switchTab = (key: string) => {
    router.push(key ? `/favorites?category=${key}` : '/favorites', { scroll: false });
  };

  const handleUnfavorite = () => {
    fetchFavorites();
  };

  return (
    <div className="recommend-content">
      <div className="category-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`category-tab ${category === t.key ? 'active' : ''}`}
            onClick={() => switchTab(t.key)}
          >
            <span className="category-tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="recommend-body">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--taupe)', marginTop: 40, fontSize: 14 }}>加载中…</p>
        ) : favorites.length > 0 ? (
          <GallerySection
            title={`⭐ 我的收藏（${favorites.length}）`}
            items={favorites.map(f => ({
              badge: f.post.badge,
              emoji: f.post.emoji,
              name: f.post.title,
              desc: f.post.description,
              postId: f.post.id,
              category: f.post.section.category,
              isFavorited: true,
              favoriteId: f.id,
            }))}
          />
        ) : (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>⭐</p>
            <p style={{ color: 'var(--taupe)', fontSize: 15 }}>还没有收藏，去首页看看吧</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd d:/webtest && git add web/src/app/\(main\)/favorites/ && git commit -m "feat: 个人收藏页 — 分类筛选 + 网格展示 + 空状态"
```

---

### Task 10: 个人设置页

**Files:**
- Create: `web/src/app/(main)/settings/page.tsx`

- [ ] **Step 1: 创建设置页（双栏布局）**

新建 `web/src/app/(main)/settings/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const AVATAR_OPTIONS = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🐯', '🐸', '🐵', '🐤', '🦄', '🐙'];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  const [avatar, setAvatar] = useState(user?.avatar || '🐱');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileMsg, setProfileMsg] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    if (user) {
      setAvatar(user.avatar);
      setUsername(user.username);
      setBio(user.bio);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileMsg('');
    if (!username.trim()) { setProfileMsg('❌ 用户名不能为空'); return; }
    try {
      await api.put('/users/me', { username: username.trim(), avatar, bio: bio.trim() });
      setProfileMsg('✅ 保存成功');
      refreshUser();
    } catch (err: any) {
      setProfileMsg(`❌ ${err.message || '保存失败'}`);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg('');
    if (!oldPassword) { setPasswordMsg('❌ 请输入原密码'); return; }
    if (newPassword.length < 6) { setPasswordMsg('❌ 新密码至少6位'); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg('❌ 两次新密码不一致'); return; }
    try {
      await api.put('/users/me/password', { oldPassword, newPassword });
      setPasswordMsg('✅ 密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg(`❌ ${err.message || '修改失败'}`);
    }
  };

  return (
    <div style={{ padding: '36px 48px' }}>
      <h2 style={{ ...styles.pageTitle }}>⚙️ 账号设置</h2>

      <div style={styles.twoCol}>
        {/* 左栏：个人资料 */}
        <div style={styles.column}>
          <h3 style={styles.sectionTitle}>个人资料</h3>

          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 14 }}>{avatar}</div>
          <div style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a}
                style={{
                  ...styles.avatarOption,
                  ...(avatar === a ? styles.avatarOptionActive : {}),
                }}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>

          <label style={styles.label}>用户名</label>
          <input
            style={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={50}
          />

          <label style={styles.label}>个人介绍</label>
          <textarea
            style={{ ...styles.input, height: 80, resize: 'vertical' as const }}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            placeholder="介绍一下自己…"
          />

          {profileMsg && (
            <p style={{ fontSize: 13, marginTop: 8, color: profileMsg.startsWith('✅') ? '#7d9a70' : '#c0392b' }}>
              {profileMsg}
            </p>
          )}
          <button style={styles.btn} onClick={handleSaveProfile}>保存资料</button>
        </div>

        {/* 右栏：安全 */}
        <div style={styles.column}>
          <h3 style={styles.sectionTitle}>修改密码</h3>

          <label style={styles.label}>原密码</label>
          <input
            style={styles.input}
            type="password"
            placeholder="原密码"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />

          <label style={styles.label}>新密码</label>
          <input
            style={styles.input}
            type="password"
            placeholder="新密码（至少6位）"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <label style={styles.label}>确认新密码</label>
          <input
            style={styles.input}
            type="password"
            placeholder="确认新密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {passwordMsg && (
            <p style={{ fontSize: 13, marginTop: 8, color: passwordMsg.startsWith('✅') ? '#7d9a70' : '#c0392b' }}>
              {passwordMsg}
            </p>
          )}
          <button style={{ ...styles.btn, background: '#c06840' }} onClick={handleChangePassword}>
            修改密码
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageTitle: {
    fontFamily: 'var(--font-playfair), serif',
    fontSize: 28,
    color: '#2d1a0e',
    marginBottom: 24,
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 32,
  },
  column: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: 28,
    boxShadow: 'var(--shadow-sm)',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#b8a088',
    marginBottom: 16,
    fontWeight: 500,
    fontFamily: 'var(--font-source-sans), sans-serif',
  },
  label: {
    display: 'block',
    fontSize: 13,
    color: '#8a7a6a',
    marginBottom: 6,
    marginTop: 12,
    fontFamily: 'var(--font-source-sans), sans-serif',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #e5d5c0',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'var(--font-source-sans), sans-serif',
    boxSizing: 'border-box' as const,
  },
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 6,
    marginBottom: 8,
  },
  avatarOption: {
    fontSize: 24,
    padding: '6px 0',
    border: '2px solid transparent',
    borderRadius: 12,
    background: '#fdfaf6',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  avatarOptionActive: {
    background: '#fef5ee',
    border: '2px solid #c06840',
  },
  btn: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: 12,
    background: '#7d9a70',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 14,
    fontFamily: 'var(--font-source-sans), sans-serif',
  },
};
```

- [ ] **Step 2: Commit**

```bash
cd d:/webtest && git add web/src/app/\(main\)/settings/ && git commit -m "feat: 个人设置页 — 双栏满宽布局"
```

---

### Task 11: CSS 追加 — TabBar / Tab / 收藏按钮 / 响应式

**Files:**
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: 追加新样式**

在 `web/src/app/globals.css` 末尾追加:

```css
/* ===== Category Tabs (in recommend/favorites page) ===== */
.category-tabs {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 20px 48px 8px;
  flex-wrap: wrap;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 28px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all .25s ease;
  font-family: var(--font-source-sans), sans-serif;
  white-space: nowrap;
}

.category-tab:hover {
  background: rgba(192,104,64,.04);
  border-color: var(--terracotta);
  color: var(--terracotta);
}

.category-tab.active {
  background: var(--terracotta);
  color: #fff;
  border-color: var(--terracotta);
  box-shadow: 0 4px 16px rgba(192,104,64,.25);
}

.category-tab-icon {
  font-size: 18px;
}

/* ===== Recommend Content ===== */
.recommend-content {
  padding: 0;
}

.recommend-search {
  padding: 28px 48px 0;
}

.recommend-body {
  padding: 0 48px 40px;
}

/* ===== Favorite Button on cards ===== */
.fav-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,.85);
  backdrop-filter: blur(6px);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .2s ease, background .2s ease;
  padding: 0;
  line-height: 1;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(45,26,14,.1);
}

.fav-btn:hover {
  transform: scale(1.15);
  background: rgba(255,255,255,.95);
}

.fav-btn.active {
  background: rgba(255,255,255,.9);
}

.fav-btn.pop {
  animation: favPop .3s cubic-bezier(.34,1.56,.64,1);
}

@keyframes favPop {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* ===== Mobile Bottom TabBar ===== */
.mobile-tabbar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  z-index: 90;
  grid-template-columns: repeat(3, 1fr);
  box-shadow: 0 -2px 12px rgba(45,26,14,.06);
}

.mobile-tabbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--taupe);
  transition: color .2s;
  font-family: var(--font-source-sans), sans-serif;
}

.mobile-tabbar-item.active {
  color: var(--terracotta);
}

.mobile-tabbar-icon {
  font-size: 22px;
}

.mobile-tabbar-label {
  font-size: 11px;
  font-weight: 500;
}

/* ===== Settings Responsive ===== */
@media (max-width: 768px) {
  .settings-two-col {
    grid-template-columns: 1fr !important;
  }
}

/* ===== Responsive updates ===== */
@media (max-width: 1024px) {
  .recommend-search { padding: 24px 28px 0; }
  .recommend-body { padding: 0 28px 40px; }
  .category-tabs { padding: 16px 28px 4px; }
}

@media (max-width: 768px) {
  .recommend-search { padding: 16px 16px 0; }
  .recommend-body { padding: 0 16px 100px; }
  .category-tabs { padding: 12px 16px 4px; gap: 4px; }
  .category-tab { padding: 8px 16px; font-size: 13px; }
  .category-tab-icon { font-size: 16px; }
  .fav-btn { width: 30px; height: 30px; font-size: 16px; top: 8px; right: 8px; }

  .mobile-tabbar { display: grid; }

  .right-panel { padding: 0 0 60px; }

  .left-panel { display: none !important; }
  .mobile-menu-btn { display: none !important; }
}
```

- [ ] **Step 2: Commit**

```bash
cd d:/webtest && git add web/src/app/globals.css && git commit -m "feat: CSS — TabBar / 分类Tab / 收藏按钮 / 响应式适配"
```

---

### Task 12: 清理旧文件 + 全量编译检查

**Files:**
- Delete: `web/src/app/page.tsx`（移至 (main)/page.tsx）
- Delete: `web/src/app/settings/page.tsx`（移至 (main)/settings/page.tsx）
- Delete: `web/src/components/RightPanel.tsx`（被 RecommendContent 替代）

- [ ] **Step 1: 删除旧文件**

```bash
cd d:/webtest && rm web/src/app/page.tsx && rm web/src/app/settings/page.tsx && rm web/src/components/RightPanel.tsx
```

- [ ] **Step 2: 前端 TypeScript 编译检查**

```bash
cd d:/webtest/web && npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: 后端 TypeScript 编译检查**

```bash
cd d:/webtest/server && npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 4: 最后 Commit**

```bash
cd d:/webtest && git add -A && git commit -m "chore: 清理旧文件 — page.tsx / settings / RightPanel 已被替代"
```

---

## 验证清单

启动所有服务后逐项检查：

| # | 检查项 | 预期行为 |
|---|--------|----------|
| 1 | 访问 `http://localhost:3000` | 加载胖喵推荐，默认显示美食 Tab |
| 2 | 点击左侧"胖喵推荐" | 回到首页 |
| 3 | 点击左侧"个人收藏" | 跳转 /favorites，显示收藏列表 |
| 4 | 点击左侧"个人设置" | 跳转 /settings，双栏设置表单 |
| 5 | 切换分类 Tab（美食/旅游/游玩） | URL 变为 /?tab=xxx，内容刷新 |
| 6 | 搜索关键词后切换 Tab | 搜索清除，恢复正常浏览 |
| 7 | 搜索结果后点清除 | 恢复分区浏览 |
| 8 | 点击卡片收藏按钮 ♡ | 变为 ❤️，有弹跳动画 |
| 9 | 再次点击 ❤️ | 变为 ♡，取消收藏 |
| 10 | 进入收藏页 | 显示已收藏帖子，可筛选分类 |
| 11 | 收藏页取消收藏 | 卡片从列表移除 |
| 12 | 个人设置修改资料保存 | 保存成功，左上角用户名更新 |
| 13 | 个人设置修改密码 | 密码修改成功提示 |
| 14 | 缩小浏览器到 ≤768px | 左侧栏消失，底部出现 TabBar |
| 15 | 点击底部 TabBar 各项 | 正常跳转 / /favorites /settings |
| 16 | 点击帖子卡片 | 跳转详情页，正常查看 |
| 17 | 退出登录 | 跳转 /login |
| 18 | `npx tsc --noEmit` server + web | 0 errors |
