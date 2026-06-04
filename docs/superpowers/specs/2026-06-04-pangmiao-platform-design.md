# 胖喵推荐平台 — 设计文档

> 日期：2026-06-04 | 状态：草稿

## 一、项目概述

将现有单页面「胖喵个人主页」升级为**多层次内容平台**，支持用户注册登录后浏览推荐内容、评论、投稿，及 AI 数字分身对话。

**用户角色：**
- 访客：仅可见登录/注册页
- 普通用户：浏览推荐、查看详情、发表评论、使用 AI 聊天、投稿
- 管理员：在独立后台审核投稿、管理内容

**核心模块：**
1. 用户注册/登录（JWT）
2. 推荐内容浏览（卡片列表 + 详情页 + 评论区）
3. 用户投稿（提交推荐 → 管理员审核）
4. AI 数字分身对话（保留现有功能）
5. 独立管理后台

---

## 二、项目结构

```
pangmiao-platform/
├── server/                    # 后端 — NestJS
│   ├── src/
│   │   ├── auth/              # 认证模块
│   │   ├── users/             # 用户模块
│   │   ├── posts/             # 推荐内容模块
│   │   ├── comments/          # 评论模块
│   │   ├── chat/              # AI 聊天模块
│   │   ├── prisma/            # Prisma service + schema
│   │   └── common/            # 守卫、装饰器、过滤器
│   ├── prisma/schema.prisma
│   └── package.json
├── web/                       # 前端 — Next.js 15（用户端）
│   ├── src/app/
│   │   ├── login/             # 登录页
│   │   ├── register/          # 注册页
│   │   ├── (auth)/            # 认证布局（需登录）
│   │   │   ├── page.tsx       # 首页推荐列表
│   │   │   ├── [id]/          # 卡片详情 + 评论区
│   │   │   └── submit/        # 投稿页
│   │   └── layout.tsx
│   ├── src/components/
│   ├── src/hooks/
│   ├── src/lib/
│   └── package.json
├── admin/                     # 前端 — Next.js（管理后台）
│   ├── src/app/
│   │   ├── login/
│   │   ├── (admin)/
│   │   │   ├── page.tsx       # 仪表盘
│   │   │   ├── posts/         # 内容审核
│   │   │   └── users/         # 用户管理
│   │   └── layout.tsx
│   └── package.json
├── packages/shared/           # 共享类型
│   ├── types/
│   └── constants/
├── package.json               # pnpm workspace root
└── pnpm-workspace.yaml
```

### 技术栈

| 层 | 技术 |
|---|------|
| 前端 | Next.js 15 / React 19 / TypeScript |
| 后端 | NestJS / Prisma / JWT / bcrypt |
| 数据库 | MySQL |
| AI | DeepSeek API（代理转发） |
| 包管理 | pnpm workspace monorepo |
| 测试 | Playwright（E2E） |

---

## 三、数据库设计（首期）

### User
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int (PK, auto) | |
| username | String (unique) | 登录名 |
| password | String | bcrypt 哈希 |
| role | Enum (USER, ADMIN) | 默认 USER |
| createdAt | DateTime | |
| updatedAt | DateTime | |

后续扩展：Post、Comment、ChatHistory（不属于首期）

---

## 四、API 设计（首期）

| 方法 | 路由 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 注册（username + password） | 否 |
| POST | /api/auth/login | 登录，返回 JWT | 否 |
| GET | /api/users/me | 获取当前用户信息 | 是 |

后续扩展：posts CRUD、comments CRUD、chat 代理

---

## 五、认证流程

1. 用户注册：POST /api/auth/register → 校验用户名唯一 → bcrypt 哈希密码 → 存入 User 表 → 返回成功
2. 用户登录：POST /api/auth/login → 查 User 表 → bcrypt 比对 → 签发 JWT（过期 7 天）
3. 前端：JWT 存 localStorage，axios/fetch 拦截器自动带 Authorization header
4. NestJS Guard：解析 JWT → 注入 req.user

---

## 六、前端页面流

```
/login ──→ 登录成功 → / (首页)
/register ──→ 注册成功 → /login
/ ──→ 未登录 → /login
/ ──→ 推荐卡片列表 → 点击卡片 → /[id]（详情 + 评论区）
/submit ──→ 投稿表单
```

---

## 七、首期实施范围（最小可用）

1. pnpm workspace monorepo 骨架搭建
2. NestJS server 启动成功，连接 MySQL
3. User 表建好，Prisma migrate 完成
4. /api/auth/register + /api/auth/login 可用
5. web 端登录/注册页面，认证守卫
6. 首页展示现有推荐数据（硬编码过渡）
7. admin 端骨架（登录 + 空仪表盘）

**不做：** 评论、投稿、管理员审核、内容管理 CRUD（后续迭代）

---

## 八、第二期计划

- Post、Comment 数据表
- 内容管理 API（CRUD）
- 用户端投稿流程
- 管理员审核流程
- 卡详情页 + 评论区
- AI 聊天模块接入
- 现有 LeftPanel/RightPanel 样式重构

---

## 九、开放问题

- MySQL 连接信息？（本地 / 远程 / 端口）
- 部署目标？（VPS / 云服务 / 暂不考虑）
- 现有代码中的组件能否直接迁移到 web/ 下？（确认后可以复用）
