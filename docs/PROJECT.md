# 胖喵推荐平台 — 项目文档

> 最后更新：2026-06-04 | 分支：feat/v4-platform | 版本：0.1.0

## 一、项目概述

从单页面「胖喵个人主页」升级为**三层架构的吃喝玩乐推荐内容平台**。

- **定位：** 全封闭会员制，注册登录后浏览推荐内容，AI 数字分身对话
- **用户角色：** 访客（只能看登录页）→ 普通用户（浏览/评论/投稿/聊天）→ 管理员（审核投稿/管理内容）
- **仓库：** `d:\webtest`，pnpm workspace monorepo

## 二、技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 包管理 | pnpm workspace | 4 个子包 |
| 后端 | NestJS 11 + Prisma 6 | REST API，:4000 |
| 数据库 | MySQL 8.1 | `pangmiao_dev` 库，本地 root/123456 |
| 前端（用户端） | Next.js 15 + React 19 | :3000 |
| 前端（管理端） | Next.js 15 + React 19 | :3005 |
| 认证 | JWT + bcryptjs | 7 天过期，双重存储（localStorage + cookie） |
| AI | DeepSeek API | 代理转发，保留原功能 |
| 测试 | Playwright | 原有测试待更新 |
| 设计 | 自写 CSS | 暖色系，Playfair Display + Source Sans 3 |

## 三、项目结构

```
webtest/
├── server/                          # 后端 — NestJS
│   ├── prisma/schema.prisma         # User 数据模型
│   ├── src/
│   │   ├── main.ts                  # 入口，CORS(:3000/:3005)，全局 /api 前缀
│   │   ├── app.module.ts            # 根模块
│   │   ├── prisma/                  # PrismaService（全局），PrismaModule
│   │   ├── auth/                    # 认证模块
│   │   │   ├── auth.service.ts      # 注册/登录逻辑
│   │   │   ├── auth.controller.ts   # POST /auth/register, /auth/login
│   │   │   ├── jwt.strategy.ts      # JWT 验证策略
│   │   │   ├── jwt-auth.guard.ts    # 认证守卫
│   │   │   └── dto/                 # register.dto, login.dto
│   │   └── users/                   # 用户模块
│   │       ├── users.service.ts     # findById
│   │       └── users.controller.ts  # GET /users/me（需认证）
│   ├── .env                         # DATABASE_URL, JWT_SECRET, PORT=4000
│   └── package.json
├── web/                             # 前端 — 用户端（原项目迁移至此）
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # AuthProvider 包裹全局
│   │   │   ├── page.tsx             # 首页（认证守卫 + 原有组件）
│   │   │   ├── login/page.tsx       # 登录页
│   │   │   ├── register/page.tsx    # 注册页
│   │   │   ├── globals.css          # 原项目所有样式（~800行，待拆分）
│   │   │   └── api/chat/route.ts    # DeepSeek 代理（原有）
│   │   ├── components/              # 原有 5 个组件
│   │   │   ├── LeftPanel.tsx        # 左侧个人信息 + 导航
│   │   │   ├── RightPanel.tsx       # 右侧推荐内容 + 搜索 + 硬编码数据
│   │   │   ├── GallerySection.tsx   # 推荐分类区
│   │   │   ├── GalleryCard.tsx      # 推荐卡片
│   │   │   └── ChatFloat.tsx        # 浮动 AI 聊天窗
│   │   ├── hooks/useAuth.tsx        # AuthProvider + useAuth hook
│   │   ├── lib/
│   │   │   ├── api.ts               # fetch 封装，自动注入 Bearer token
│   │   │   └── deepseek.ts          # DeepSeek 调用（原有）
│   │   ├── middleware.ts            # cookie 检查 → 未登录重定向 /login
│   │   └── types/index.ts           # 类型定义（原有，未被复用）
│   ├── tests/                       # Playwright E2E 测试（原有，待更新）
│   ├── next.config.ts               # API rewrites → :4000
│   └── package.json
├── admin/                           # 前端 — 管理后台
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # AuthProvider 包裹全局
│   │   │   ├── page.tsx             # 根路由 → 自动跳转 /login 或 /dashboard
│   │   │   ├── login/page.tsx       # 管理员登录页（深色背景）
│   │   │   ├── dashboard/           # 仪表盘 + 侧边栏布局
│   │   │   │   ├── layout.tsx       # 侧边栏（仪表盘/内容审核/用户管理/退出）
│   │   │   │   └── page.tsx         # 3 个统计卡片
│   │   │   └── globals.css
│   │   ├── hooks/useAuth.tsx        # 同 web 版，少 register 方法
│   │   ├── lib/api.ts               # 同 web 版
│   │   └── middleware.ts            # 同 web 版
│   ├── next.config.ts               # API rewrites → :4000
│   └── package.json
├── packages/shared/                 # 公共类型（目前未被引用，手动保持一致）
│   └── types/auth.ts                # RegisterDto, LoginDto, LoginResponse, UserInfo
├── docs/
│   ├── PROJECT.md                   # 本文档
│   └── superpowers/
│       ├── specs/2026-06-04-pangmiao-platform-design.md   # 设计文档
│       └── plans/2026-06-04-pangmiao-platform-plan.md     # 实现计划
├── package.json                     # workspace root（dev:server/web/admin 脚本）
├── pnpm-workspace.yaml              # 声明 4 个子包
└── pnpm-lock.yaml
```

## 四、数据库

**连接信息：** `mysql://root:123456@localhost:3306/pangmiao_dev`

### User 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int, 自增主键 | |
| username | VarChar(50), unique | 登录名 |
| password | VarChar(255) | bcrypt 哈希 |
| role | VarChar(10), 默认 "USER" | USER / ADMIN |
| createdAt | DateTime, auto | |
| updatedAt | DateTime, auto | |

### 现有用户（测试用）

| username | password | role |
|----------|----------|------|
| test | 123456 | USER |
| mkl | 123456 | USER |

> 注意：目前没有管理员用户。手动升级 SQL：`UPDATE User SET role = 'ADMIN' WHERE id = 1;`

## 五、API 接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 注册 `{username, password}` → `{accessToken, user}` | 否 |
| POST | /api/auth/login | 登录 `{username, password}` → `{accessToken, user}` | 否 |
| GET | /api/users/me | 获取当前用户信息 | 是 |
| POST | /api/chat | AI 对话（web 端，走 DeepSeek 代理） | 是（web middleware） |

## 六、认证机制

1. 用户注册/登录 → Server 签发 JWT（7天过期）
2. 前端同时写入 `localStorage`（API 请求注入 Authorization header）和 `document.cookie`（Next.js middleware 读取）
3. `web/middleware.ts` 检查 cookie，无 token 则 307 重定向 `/login`
4. `useAuth` hook 在客户端验证 token 有效性（调用 `/users/me`），失败则清除 token
5. Admin 端同样机制，public path 只有 `/login`

## 七、启动方式

```bash
# 安装依赖
pnpm install

# 分别启动三端
pnpm --filter server dev    # 后端 → http://localhost:4000
pnpm --filter web dev       # 用户端 → http://localhost:3000
pnpm --filter admin dev     # 管理台 → http://localhost:3005
```

**前提条件：**
- MySQL 8.1 运行中，`pangmiao_dev` 库已创建
- `server/.env` 中 DATABASE_URL 和 JWT_SECRET 已配置
- `web/.env.local` 中 DEEPSEEK_API_KEY 已配置（AI 聊天需要）

## 八、已知问题

1. **CSS 单文件 ~800 行** — 所有样式在 `web/src/app/globals.css`，待模块化拆分
2. **静态数据混在组件中** — `RightPanel.tsx` 内硬编码了 24 条推荐数据，待抽到 data 层
3. **类型定义未复用** — `types/index.ts` 定义了类型但各处重复声明，shared 包也未实际引用
4. **字体 @import 阻塞渲染** — `globals.css` 用 `@import url()` 加载 Google Fonts，应改用 `next/font`
5. **搜索按钮无功能** — `RightPanel.tsx` 的搜索栏按钮没接入任何逻辑
6. **移动端菜单缺失** — CSS 写了完整的移动端响应式，但组件里没渲染菜单按钮和遮罩层
7. **缺少错误边界** — 无 `error.tsx`、`not-found.tsx`、Error Boundary
8. **API 缺少防护** — 无请求频率限制、无超时重试（DeepSeek 调用）
9. **Playwright 测试过时** — 测试仍引用旧页面结构，需要更新
10. **admin 共用 token** — admin 和 web 的登录是互通的（同一条 User 表），但 admin 没有角色检查
11. **pnpm 警告** — `web/package-lock.json` 残留可能导致 workspace root 推断警告

## 九、第二期计划

- 推荐内容 CRUD（Post 表 + API + 管理界面）
- 卡片详情页 + 评论区（Comment 表）
- 用户投稿流程 + 管理员审核
- 管理后台内容审核页面
- CSS 模块化拆分
- `next/font` 字体优化
- 搜索功能实现
- 移动端菜单
- 错误边界 + 404 页面
- API 限流 + DeepSeek 超时重试
- Playwright 测试更新
- SEO 元数据完善

## 十、设计决策记录

1. **为什么用 bcryptjs 而不是 bcrypt？** — Windows 下 bcrypt 原生编译失败，bcryptjs 是纯 JS 实现，功能相同无性能差异
2. **为什么 token 同时存 localStorage 和 cookie？** — localStorage 给 API 请求注入 Authorization header；cookie 给 Next.js middleware 做服务端路由守卫。两者各司其职
3. **为什么 admin 是独立 Next.js 应用？** — 用户要求前后端分离，管理后台与用户端独立部署
4. **为什么用 NestJS？** — 用户选择了 NestJS（方案 B），原生 TypeScript + 模块化 + 依赖注入适合后续扩展
5. **为什么 middleware 不用 httpOnly cookie？** — 因为 token 也需要在客户端 JS 中读取（注入 API 请求头），httpOnly cookie 对 JS 不可见
