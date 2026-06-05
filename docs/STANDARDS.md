# 胖喵推荐平台 — 项目规范

> 最后更新：2026-06-05 | 版本：0.2.0

---

## 一、项目架构

```
webtest/                         pnpm monorepo
├── server/     NestJS 11        :4000   REST API
├── web/        Next.js 15       :3000   用户端
├── admin/      Next.js 15       :3005   管理后台
└── packages/shared/             公共类型（暂未实际引用）
```

**技术栈**: NestJS + Prisma 6 + MySQL 8.1 | Next.js 15 + React 19 | JWT 认证

---

## 二、API 命名规范

### 基本原则

| 规则 | 示例 |
|------|------|
| 资源名用复数名词 | `/posts` 不是 `/post` |
| 搜索用独立端点 + `q` 参数 | `GET /search?q=火锅` |
| CRUD 用标准 HTTP 方法 | GET / POST / PUT / DELETE |
| 切换状态用 PATCH | `PATCH /posts/:id/toggle` |
| 嵌套资源体现层级 | `GET /posts/:id/comments` |
| 管理操作用 `/admin/` 前缀 | `POST /admin/posts` |
| 公开接口不加前缀 | `GET /sections` |

### 端点清单

```
# 分类浏览
GET    /sections?category=food

# 搜索
GET    /search?q=火锅&category=food

# 卡片
GET    /posts?category=food&published=true
GET    /posts/:id                    # 详情（含评论树）

# 评论
GET    /posts/:id/comments
POST   /posts/:id/comments           # 需登录
DELETE /comments/:id                 # 需登录，仅作者

# 评分
POST   /posts/:id/rate               # 需登录 { score: 1-5 }
GET    /posts/:id/rating             # 需登录，查自己的评分

# 文件上传
POST   /admin/upload                 # 需管理员 { file }

# 管理端
GET    /admin/stats                  # 仪表盘统计
GET    /admin/users                  # 用户列表
GET    /admin/posts?category=&published=
POST   /admin/posts
PUT    /admin/posts/:id
DELETE /admin/posts/:id
PATCH  /admin/posts/:id/toggle       # 发布/隐藏
GET    /admin/sections
POST   /admin/sections
PUT    /admin/sections/:id
DELETE /admin/sections/:id
```

### 查询参数规范

| 参数 | 用途 | 示例 |
|------|------|------|
| `q` | 搜索关键词 | `/search?q=火锅` |
| `category` | 分类筛选 | `?category=food` |
| `published` | 发布状态 | `?published=true` |

---

## 三、数据库规范

### 模型

```
User      用户（id, username, password, role, avatar, bio）
Section   栏目（id, title, category, sortOrder） category: food|travel|fun
Post      卡片（id, title, description, emoji, badge, content, images,
                published, sortOrder, ratingAvg, ratingCount, sectionId→Section）
Comment   评论（id, content, postId→Post, userId→User, parentId→self）
Rating    评分（id, score, postId→Post, userId→User, UNIQUE[postId,userId]）
```

### 命名规范

- **表名**: PascalCase 单数（Prisma 默认）→ 生成 snake_case 复数表名
- **字段**: camelCase
- **外键**: `关联表名Id`，如 `sectionId`
- **时间戳**: `createdAt` / `updatedAt`，全部模型标配
- **排序**: `sortOrder` Int，数字越小越靠前
- **文本**: 短文本 `@db.VarChar(N)`，长文本 `@db.Text`（不设默认值）

### 迁移

```bash
cd server
pnpm db:migrate    # prisma migrate dev → 生成迁移文件
pnpm db:seed       # ts-node prisma/seed.ts → 填充测试数据
```

---

## 四、前端规范

### 样式方案

- **不使用任何 UI 库**（无 shadcn、MUI、Ant Design）
- **全局样式**: `globals.css`，CSS 变量 + 类名
- **组件样式**: 内联 `CSSProperties` 对象，`const styles: Record<string, React.CSSProperties>`
- **设计 Token**: 暖色系，CSS 变量定义在 `:root` 中

```css
--ink: #2d1a0e;        --terracotta: #c06840;   --amber: #d49b40;
--sage: #7d9a70;        --parchment: #f9f5ed;    --surface: #fefdf9;
--taupe: #b8a088;       --border: #e5d5c0;
```

### 字体

- 标题: **Playfair Display**（`var(--font-playfair)`）
- 正文: **Source Sans 3**（`var(--font-source-sans)`）
- 通过 `next/font/google` 加载，CSS 变量注入

### 组件模式

```typescript
// 1. 接口定义在上
interface Props { ... }

// 2. 组件函数
export function MyComponent({ prop }: Props) {
  const [state, setState] = useState(...);

  return (
    <div style={styles.container}>
      ...
    </div>
  );
}

// 3. 样式对象在文件末尾
const styles: Record<string, React.CSSProperties> = {
  container: { ... },
};
```

### API 调用

```typescript
import { api } from '@/lib/api';

// GET
const data = await api.get<Type[]>(`/path?param=value`);

// POST / PUT
await api.post('/path', { body });

// DELETE
await api.del('/path/1');
```

### 路由规范

| 路由 | 页面 |
|------|------|
| `/` | 首页（需登录） |
| `/login` | 登录 |
| `/register` | 注册 |
| `/settings` | 个人设置 |
| `/food/1` | 卡片详情（[category]/[id]） |

---

## 五、后端规范

### 模块结构

```
src/
├── main.ts           入口（CORS、全局前缀 /api、静态文件）
├── app.module.ts     根模块
├── prisma/           PrismaService（@Global）+ PrismaModule
├── auth/             认证（register/login、JWT、Guard）
├── users/            用户（profile CRUD、密码修改）
└── posts/            内容（sections、posts、comments、ratings、search、upload、stats）
```

### Controller 模式

```typescript
@Controller('资源名')
export class XxxController {
  constructor(private service: XxxService) {}

  @Get()
  async list(@Query('param') param?: string) { ... }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) { ... }
}
```

### 权限

| Guard | 用途 |
|-------|------|
| `JwtAuthGuard` | 需要登录 |
| `AdminGuard` | 需要 role=ADMIN |

### 服务端启动检查

```bash
cd server && npx tsc --noEmit   # 每次改完后端必须过编译
```

---

## 六、Git 规范

### Commit 格式

```
<type>: <中文描述>

- 具体改动 1
- 具体改动 2
```

**type**: `feat` / `fix` / `refactor` / `chore` / `docs`

### 提交前检查

1. `npx tsc --noEmit` 无错误（server + web + admin 三端都要过）
2. 功能验证通过

---

## 七、开发工作流

```bash
# 启动
pnpm --filter server dev     # :4000
pnpm --filter web dev        # :3000
pnpm --filter admin dev      # :3005

# 数据库
cd server
pnpm db:migrate              # 改 schema 后运行
pnpm db:seed                 # 重置后填充数据

# 类型检查
cd server && npx tsc --noEmit
cd web && npx tsc --noEmit
cd admin && npx tsc --noEmit
```
