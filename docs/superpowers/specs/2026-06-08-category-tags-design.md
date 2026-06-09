# 标签系统重构 — 设计文档

> 日期：2026-06-08 | 状态：待实现

---

## 一、目标

将现有的"硬编码三分类（food/travel/fun）"重构为**多维度标签系统**：
- 支持多对多（一个帖子多个标签）
- 支持标签分组（城市/类型/场景…）
- 新增标签零代码改动
- 前端 TABS 全动态渲染

---

## 二、数据库

### 2.1 新增表

```prisma
// 标签分组（维度）
model CategoryGroup {
  id        Int        @id @default(autoincrement())
  key       String     @unique @db.VarChar(20)   // city, type, scene…
  label     String     @db.VarChar(20)            // 城市, 类型, 场景…
  sortOrder Int        @default(0)
  categories Category[]
}

// 具体标签
model Category {
  id        Int            @id @default(autoincrement())
  key       String         @unique @db.VarChar(20)  // shenzhen, food, date…
  label     String         @db.VarChar(20)           // 深圳, 美食, 约会…
  icon      String         @db.VarChar(10)           // 🏙️, 🍽️, 🎯…
  sortOrder Int            @default(0)
  groupId   Int
  group     CategoryGroup  @relation(fields: [groupId], references: [id], onDelete: Cascade)
  posts     PostCategory[]
}

// 帖子↔标签 多对多
model PostCategory {
  postId     Int
  categoryId Int
  post       Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([postId, categoryId])
}

// Post 加关系
model Post {
  // …现有字段…
  categories PostCategory[]
}
```

### 2.2 Section 改动

```diff
model Section {
-  category  String   @db.VarChar(10) // food | travel | fun  ← 删除
   title     String   @db.VarChar(50)
   sortOrder Int      @default(0)
   // …其余不变
}
```

### 2.3 迁移计划

1. 创建 `CategoryGroup`、`Category`、`PostCategory` 表
2. INSERT 现有分类数据：
   - 分组 `type`：美食(food)、旅游(travel)、游玩(fun)
3. 根据 `Section.category` 和 `Post.sectionId` 关联，写入 `PostCategory`
4. 删除 `Section.category` 列

---

## 三、后端 API

### 3.1 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/categories` | 返回所有分组及其标签（按 sortOrder 排） |
| GET | `/categories?group=type` | 按分组过滤 |

返回格式：
```json
[
  {
    "id": 1,
    "key": "city",
    "label": "城市",
    "categories": [
      { "id": 10, "key": "shenzhen", "label": "深圳", "icon": "🏙️", "sortOrder": 1 },
      { "id": 11, "key": "beijing", "label": "北京", "icon": "🏛️", "sortOrder": 2 }
    ]
  },
  {
    "id": 2,
    "key": "type",
    "label": "类型",
    "categories": [
      { "id": 20, "key": "food", "label": "美食", "icon": "🍽️", "sortOrder": 1 },
      { "id": 21, "key": "travel", "label": "旅游", "icon": "✈️", "sortOrder": 2 },
      { "id": 22, "key": "fun", "label": "游玩", "icon": "🎮", "sortOrder": 3 }
    ]
  }
]
```

### 3.2 Posts 查询改动

```
# 旧：?category=food（单值）
# 新：?categories=food,shenzhen（逗号分隔，交集）
```

`PostsService.findAllSections` → 改为不依赖 category，Section 仅作纯分区展示。
`PostsService.search` → 支持 `categories` 多选。

### 3.3 管理员接口（admin:3005 使用）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST/PUT/DELETE | `/admin/category-groups` | 分组 CRUD |
| GET/POST/PUT/DELETE | `/admin/categories` | 标签 CRUD（含 groupId） |
| PUT | `/admin/posts/:id` | 编辑卡片时接收 `categoryIds: number[]` |

### 3.4 新模块结构

```
server/src/
  categories/
    categories.module.ts
    categories.controller.ts     ← 公开 GET /categories
    categories.service.ts
    admin-categories.controller.ts  ← 管理端 CRUD
```

---

## 四、前端改动

### 4.1 移除所有硬编码

| 文件 | 操作 |
|------|------|
| `types/index.ts` | 删除 `TabKey` 类型 |
| `RecommendContent.tsx` | 删除 `TABS` 数组，改为 `GET /categories` |
| `FavoritesContent.tsx` | 同上 |
| `[category]/[id]/page.tsx` | 删除 `CAT_LABELS`/`CAT_EMOJIS`，改为 API 查询 |

### 4.2 动态 TABS

```
┌─ 推荐页 ─────────────────────────────────┐
│                                          │
│  [🏙️深圳] [🍽️美食] [✈️旅游] [🎮游玩]      │  ← 全标签打平，从 API 拉
│   ─────────城市/类型─────────              │     sortOrder 控制顺序
│                                          │
│  🔍 [搜美食、饮品、目的地…]  [搜索]         │
│                                          │
│  ┌─ 📌 猪脚饭 ────────────────────────┐   │
│  │  🍖  [🏙️深圳] [🍽️美食]            │   │  ← 多标签展示
│  │  🏷️ 地道小吃                        │   │
│  └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### 4.3 URL 参数

```
/?categories=food,shenzhen    → 筛选：美食 ∩ 深圳
/favorites?categories=food    → 收藏筛选
```

---

## 五、管理后台（admin:3005）

### 5.1 标签分组管理

```
┌─ ⚙️ 标签分组管理 ──────────────────────────┐
│                                            │
│  [+ 新建分组]                               │
│                                            │
│  排序 名称    Key       操作                │
│  1    城市    city      ✏️ 🗑              │
│  2    类型    type      ✏️ 🗑              │
│  3    场景    scene     ✏️ 🗑              │
│                                            │
└────────────────────────────────────────────┘
```

### 5.2 标签管理

```
┌─ ⚙️ 标签管理 ────────────────────────────────┐
│  所属分组: [类型 ▾]                           │
│                                              │
│  [+ 新增标签]                                 │
│                                              │
│  排序 图标  Key        名称      所属分组    操作 │
│  1    🍽️   food      美食      类型        ✏️ 🗑│
│  2    ✈️   travel    旅游      类型        ✏️ 🗑│
│  3    🏙️   shenzhen  深圳      城市        ✏️ 🗑│
│                                              │
└──────────────────────────────────────────────┘
```

### 5.3 卡片编辑（加标签选择器）

```
┌─ ✏️ 编辑卡片 ─────────────────────────────┐
│                                           │
│  标题: [猪脚饭___________________]          │
│  Emoji: [🍖]  Badge: [地道小吃]             │
│  …                                        │
│                                           │
│  标签:                                     │
│   城市: [深圳 ▾]  [✕]                      │
│   类型: [美食 ▾]  [✕]                      │
│   [+ 添加标签]                             │
│                                           │
│  [💾 保存]                                 │
└───────────────────────────────────────────┘
```

多选器支持键入搜索过滤（标签多了也找得到）。

---

## 六、执行顺序

1. **DB migration** → 建表 + 迁移旧数据
2. **后端 categories 模块** → API + 管理端接口
3. **后端 posts 适配** → 多标签过滤 + search 改造
4. **前端动态 TABS** → 替换所有硬编码
5. **管理后台** → 分组/标签管理页 + 卡片编辑加标签选择器
6. **类型检查 + 验证**

---

## 七、验证

1. `GET /categories` 返回分组+标签树 ✅
2. `GET /posts?categories=food,shenzhen` 返回交集结果 ✅
3. 推荐页 TABS 动态渲染，新增标签自动出现 ✅
4. 管理后台新建分组/标签 → 前端即时生效 ✅
5. 卡片多标签展示正确 ✅
6. `npx prisma migrate` 零错误 ✅
7. `npx tsc --noEmit` web + server 零错误 ✅
