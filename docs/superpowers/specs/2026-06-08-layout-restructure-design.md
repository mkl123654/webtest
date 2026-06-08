# 胖喵推荐平台 — 布局重构 & 收藏功能设计

> 日期：2026-06-08 | 状态：待实现

---

## 一、目标

1. 左侧菜单改为功能导航：胖喵推荐 / 个人收藏 / 个人设置
2. 美食/旅游/游玩整合到「胖喵推荐」页内用 Tab 切换（URL 参数 `?tab=food`）
3. 新增收藏功能（前后端）
4. 移动端改为底部 TabBar

---

## 二、路由 & 布局架构

采用 Next.js Route Group `(main)/` 统一三个页面的共享布局。

```
app/
  layout.tsx                    ← 根布局（AuthProvider + 字体，不变）
  (main)/
    layout.tsx                  ← 共享：认证守卫 + LeftPanel + 内容区 + ChatFloat
    page.tsx                    ← 胖喵推荐 /?tab=food|travel|fun
    favorites/page.tsx          ← 个人收藏 /favorites
    settings/page.tsx           ← 个人设置 /settings
  login/page.tsx                ← 不变
  register/page.tsx             ← 不变
  [category]/[id]/page.tsx      ← 帖子详情（不变）
  globals.css                   ← 追加新样式
```

`(main)/layout.tsx` 职责：
- 认证守卫（未登录→/login）
- 渲染 LeftPanel + 子页面内容 + ChatFloat
- `.app` 双栏容器

---

## 三、LeftPanel 重构

**文件**: `web/src/components/LeftPanel.tsx`

### Props 变更
- 旧：`activeTab: 'food'|'travel'|'fun'` + `onTabChange`
- 新：无 props，内部用 `usePathname()` 判断当前路由

### 内容结构
```
头像区（不变）
  ├── 头像 emoji + 在线绿点
  ├── 用户名 + "吃货 · 旅行达人"
  └── 点击弹出下拉卡片
        ├── 头像、用户名、ID、简介
        └── 🚪 退出（移除 ⚙️ 设置按钮）

导航菜单（替换原 3 个分类 Tab，去掉"📂 推荐分类"标签）
  ├── 🐱 胖喵推荐    → href="/"          active: pathname === "/"
  ├── ⭐ 个人收藏    → href="/favorites"  active: pathname.startsWith("/favorites")
  └── ⚙️ 个人设置    → href="/settings"   active: pathname.startsWith("/settings")
```

- 菜单项使用 Next.js `Link` 组件
- 延续现有 `.nav-tab` 样式（hover 暖色背景，active 高亮）
- 移动端（≤768px）LeftPanel 整体隐藏

---

## 四、胖喵推荐页

**文件**: `web/src/app/(main)/page.tsx`

### 布局
```
┌──────────────────────────────────────────┐
│  [🔍 搜美食、饮品…                   搜索]  ← 全局搜索栏
│  [🍽️ 美食推荐] [✈️ 旅游推荐] [🎮 游玩推荐]   ← 分类 Tab
│  ┌─ 火锅专区 ─────────────────────────┐  │
│  │  [卡片♡] [卡片♡] [卡片♡] [卡片♡]    │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 行为
- Tab 切换写入 URL search params：`/?tab=food|travel|fun`
- 搜索为全局搜索（调用 `GET /search?q=`），不限制分类
- 内容区复用 `GallerySection` + `GalleryCard`
- 将原 `RightPanel.tsx` 的内容逻辑提取为 `RecommendContent.tsx`

### 组件拆分
- **新建** `RecommendContent.tsx`：Tab 切换 + 搜索 + 分区列表渲染
- **废弃** `RightPanel.tsx`

---

## 五、收藏功能

### 5.1 后端 — Favorite 模型

**文件**: `server/prisma/schema.prisma`

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

同时给 User 和 Post 添加反向关系 `favorites Favorite[]`。

### 5.2 后端 — Favorites 模块

**新建目录**: `server/src/favorites/`

| 文件 | 职责 |
|------|------|
| `favorites.module.ts` | NestJS 模块 |
| `favorites.controller.ts` | 路由（JwtAuthGuard 守卫） |
| `favorites.service.ts` | Prisma CRUD |

**API 端点**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/favorites?category=` | 当前用户收藏列表，可选分类筛选，返回 Post 完整信息 |
| POST | `/favorites` | `{ postId }` 添加收藏 |
| DELETE | `/favorites?postId=` | 取消收藏（按 postId，前端无需查 favoriteId） |
| GET | `/favorites/check?postIds=1,2,3` | 批量查收藏状态，返回 `{ [postId]: favoriteId | null }` |

**注册**: `server/src/app.module.ts` 添加 `FavoritesModule`

### 5.3 前端 — 收藏按钮

**文件**: `web/src/components/GalleryCard.tsx`

- 卡片右上角叠加心形按钮 ♡
- 已收藏填红 ❤️，未收藏空心
- 交互：hover 放大 1.1x，点击 toggle（POST/DELETE），填充动画 0.3s
- 通过 `useAuth()` 获取当前用户，调用 favorites API
- 额外 props：`isFavorited?: boolean`、`favoriteId?: number`、`onFavoriteToggle?: () => void`

### 5.4 前端 — 收藏页

**文件**: `web/src/app/(main)/favorites/page.tsx`

- 顶部分类 Tab（同推荐页，但可选 `?category=` 筛选）
- 内容区 `GallerySection` 网格展示（和推荐页一致）
- 每张卡片右上角显示已收藏 ❤️，点击取消
- 空状态：居中提示"⭐ 还没有收藏，去首页看看吧"

---

## 六、个人设置页

**文件**: `web/src/app/(main)/settings/page.tsx`

### 双栏布局

```
┌──────────────────────────────────────────────────┐
│  ⚙️ 账号设置                                      │
│                                                  │
│  ┌─ 左栏（个人资料）────┐  ┌─ 右栏（安全）──────┐ │
│  │                      │  │                    │ │
│  │  头像 [emoji 网格]   │  │  原密码 [______]   │ │
│  │  用户名 [______]     │  │  新密码 [______]   │ │
│  │  介绍 [textarea]     │  │  确认   [______]   │ │
│  │  [保存资料]          │  │  [修改密码]        │ │
│  │                      │  │                    │ │
│  └──────────────────────┘  └────────────────────┘ │
└──────────────────────────────────────────────────┘
```

- 左栏：头像选择（12 个 emoji 网格）、用户名输入、个人介绍 textarea、保存按钮
- 右栏：密码修改表单（原密码 / 新密码 / 确认 + 修改按钮）
- 去掉旧的独立页面居中卡片、返回首页按钮
- 退出登录不在此页面（保留在 LeftPanel 头像下拉菜单中）
- 样式使用内联 `CSSProperties`（遵循项目规范）
- 移动端（≤768px）双栏坍缩为单栏上下排列

---

## 七、移动端底部 TabBar

**实现位置**: `web/src/app/(main)/layout.tsx` 或独立组件 `MobileTabBar.tsx`

```
≤768px:
┌─────────────────────────────────┐
│                                 │
│        内容区                    │
│                                 │
├─────────────────────────────────┤
│  🐱 推荐  │  ⭐ 收藏  │  ⚙️ 设置  │
└─────────────────────────────────┘
```

- `position: fixed; bottom: 0;` 固定底部
- 三等分，当前页高亮（暖色）
- `>768px` 时完全隐藏
- LeftPanel 在移动端同步隐藏

---

## 八、动画 & 微交互

| 元素 | 动画 |
|------|------|
| 收藏按钮 hover | `transform: scale(1.1)` |
| 收藏按钮点击 | ❤️ 红色填充 + `scale(0.8 → 1.15 → 1)` 弹跳 0.3s |
| Tab 切换 | 内容区 opacity 淡入 200ms |
| 菜单项 | 复用现有 hover/active 过渡 |

---

## 九、文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `server/src/favorites/*` | Favorites 模块（module/controller/service） |
| 修改 | `server/prisma/schema.prisma` | 添加 Favorite 模型 + 关系 |
| 修改 | `server/src/app.module.ts` | 注册 FavoritesModule |
| 新建 | `web/src/app/(main)/layout.tsx` | 共享布局 |
| 新建 | `web/src/app/(main)/page.tsx` | 胖喵推荐首页 |
| 新建 | `web/src/app/(main)/favorites/page.tsx` | 个人收藏页 |
| 新建 | `web/src/app/(main)/settings/page.tsx` | 个人设置页 |
| 新建 | `web/src/components/RecommendContent.tsx` | 推荐内容组件 |
| 修改 | `web/src/components/LeftPanel.tsx` | 菜单项重构 |
| 修改 | `web/src/components/GalleryCard.tsx` | 添加收藏按钮 |
| 修改 | `web/src/app/globals.css` | 追加 TabBar/Tab/收藏按钮样式 |
| 废弃 | `web/src/app/page.tsx` | 移至 (main)/page.tsx |
| 废弃 | `web/src/app/settings/page.tsx` | 移至 (main)/settings/page.tsx |
| 废弃 | `web/src/components/RightPanel.tsx` | 替换为 RecommendContent |
| — | `web/src/components/GallerySection.tsx` | 不变 |
| — | `web/src/components/ChatFloat.tsx` | 不变 |
| — | `web/src/hooks/useAuth.tsx` | 不变 |
| — | `web/src/lib/api.ts` | 不变 |
| — | `web/src/middleware.ts` | 不变 |
