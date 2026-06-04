# 胖喵推荐平台 首期实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 d:\webtest 原地升级为 pnpm workspace monorepo（server/web/admin/shared），实现用户注册登录、认证守卫、首页展示、admin 骨架。

**Architecture:** NestJS 后端提供 REST API，JWT 认证。web（用户端）和 admin（管理端）是两个独立 Next.js 应用，通过 HTTP 调用后端。共享类型放在 packages/shared。

**Tech Stack:** pnpm workspace、NestJS、Prisma、MySQL 8.1、JWT、bcrypt、Next.js 15、React 19、TypeScript

**环境:** npm 11.14.1、MySQL 8.1 (D:\mysql-8.1.0-winx64\)、pnpm 待装

---

## 文件结构总览

```
我们创建/修改的每个文件及其职责：
├── pnpm-workspace.yaml          # 声明 workspace 包
├── package.json                  # root：workspace 脚本
├── .npmrc                        # shamefully-hoist=true
├── packages/shared/types/auth.ts # LoginDto、RegisterDto、UserInfo 类型
├── packages/shared/types/index.ts# 统一导出
├── server/prisma/schema.prisma   # User 数据模型
├── server/src/main.ts            # NestJS 启动入口，CORS 配置
├── server/src/app.module.ts      # 根模块，注册 Prisma/Auth/Users
├── server/src/prisma/prisma.service.ts    # Prisma 客户端封装
├── server/src/prisma/prisma.module.ts     # Prisma 全局模块
├── server/src/auth/auth.service.ts        # 注册/登录业务逻辑
├── server/src/auth/auth.controller.ts     # POST /auth/register, /auth/login
├── server/src/auth/auth.module.ts         # Auth 模块
├── server/src/auth/jwt.strategy.ts        # JWT 验证策略
├── server/src/auth/jwt-auth.guard.ts      # JWT 认证守卫
├── server/src/auth/dto/login.dto.ts       # 登录请求体校验
├── server/src/auth/dto/register.dto.ts    # 注册请求体校验
├── server/src/users/users.service.ts      # 用户查询逻辑
├── server/src/users/users.controller.ts   # GET /users/me
├── server/src/users/users.module.ts       # Users 模块
├── server/package.json
├── server/tsconfig.json
├── server/.env                           # DATABASE_URL + JWT_SECRET
├── web/src/app/globals.css                # 复用现有样式（修复 @import）
├── web/src/app/layout.tsx                 # 全局面包（加入 AuthProvider）
├── web/src/app/page.tsx                   # 首页（认证后可见）
├── web/src/app/login/page.tsx             # 登录页
├── web/src/app/register/page.tsx          # 注册页
├── web/src/app/(auth)/layout.tsx          # 认证守卫布局
├── web/src/app/(auth)/page.tsx            # 首页（从现有 page.tsx 迁入）
├── web/src/components/*                   # 复用现有 5 个组件
├── web/src/hooks/useAuth.ts               # 认证状态 Hook
├── web/src/lib/api.ts                     # API 请求封装（fetch + JWT）
├── web/src/middleware.ts                  # Next.js middleware 认证守卫
├── web/package.json
├── web/next.config.ts                     # 迁移至 .ts
├── admin/src/app/globals.css              # 管理台全局样式
├── admin/src/app/layout.tsx               # 管理台布局
├── admin/src/app/page.tsx                 # 登录页（默认）
├── admin/src/app/(admin)/page.tsx         # 仪表盘
├── admin/src/app/(admin)/layout.tsx       # 认证布局
├── admin/src/hooks/useAuth.ts             # 同 web 版
├── admin/src/lib/api.ts                   # 同 web 版
├── admin/src/middleware.ts                # 认证守卫
├── admin/package.json
├── admin/next.config.ts
```

---

### Task 1: 环境准备 + 工作区骨架

**前置：** MySQL root 密码需要已知（用来创建数据库）。pnpm 通过 `npm install -g pnpm` 安装。

- [ ] **Step 1: 安装 pnpm**

```bash
npm install -g pnpm
```

验证: `pnpm --version` 应输出版本号。

- [ ] **Step 2: 创建 MySQL 数据库**

连接 MySQL 创建数据库（你需要提供 root 密码）：

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pangmiao_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

验证: `mysql -u root -p -e "SHOW DATABASES LIKE 'pangmiao_dev';"` 应显示数据库。

- [ ] **Step 3: 创建根目录文件**

创建 `d:\webtest\pnpm-workspace.yaml`：

```yaml
packages:
  - "web"
  - "server"
  - "admin"
  - "packages/*"
```

创建 `d:\webtest\.npmrc`：

```
shamefully-hoist=true
```

创建 `d:\webtest\package.json`（覆盖现有的）：

```json
{
  "name": "pangmiao-platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev:server": "pnpm --filter server dev",
    "dev:web": "pnpm --filter web dev",
    "dev:admin": "pnpm --filter admin dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint"
  }
}
```

- [ ] **Step 4: 移动现有 Next.js 代码到 web/**

```bash
mkdir web
# 移动源文件
mv src web/
mv tests web/
mv next.config.js web/
mv next-env.d.ts web/    # 如果已生成
mv tsconfig.json web/
mv .env.example web/
mv .env.local web/
mv .env web/
# package.json 改名：web 专用
mv package.json web/
```

> 注意：`.env.local` 和 `.env` 中包含 DEEPSEEK_API_KEY，移动时不要丢失。

- [ ] **Step 5: 创建目录骨架**

```bash
mkdir -p server/src server/prisma
mkdir -p admin/src/app admin/src/hooks admin/src/lib
mkdir -p packages/shared/types
```

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "chore: pnpm workspace 工作区骨架搭建，现有代码移至 web/"
```

---

### Task 2: packages/shared 类型定义

- [ ] **Step 1: 编写共享类型**

创建 `packages/shared/types/auth.ts`：

```typescript
export interface RegisterDto {
  username: string;
  password: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}
```

创建 `packages/shared/types/index.ts`：

```typescript
export * from './auth';
```

- [ ] **Step 2: 编写共享包 package.json**

创建 `packages/shared/package.json`：

```json
{
  "name": "@pangmiao/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./types/index.ts",
  "types": "./types/index.ts"
}
```

- [ ] **Step 3: 提交**

```bash
git add packages/shared/
git commit -m "feat: 共享类型包 @pangmiao/shared"
```

---

### Task 3: NestJS Server 脚手架 + Prisma

- [ ] **Step 1: 初始化 server package.json**

创建 `server/package.json`：

```json
{
  "name": "@pangmiao/server",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "@prisma/client": "^6.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "bcrypt": "^5.1.1",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@types/node": "^22.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/passport-jwt": "^4.0.0",
    "prisma": "^6.0.0",
    "typescript": "^5.7.0",
    "ts-node": "^10.9.0"
  }
}
```

创建 `server/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "lib": ["ES2021"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: 安装依赖**

```bash
pnpm install
```

- [ ] **Step 3: 创建 Prisma schema**

创建 `server/prisma/schema.prisma`：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique @db.VarChar(50)
  password  String   @db.VarChar(255)
  role      String   @default("USER") @db.VarChar(10)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

创建 `server/.env`：

```
DATABASE_URL="mysql://root:你的密码@localhost:3306/pangmiao_dev"
JWT_SECRET="dev-secret-change-in-production-abc123"
JWT_EXPIRES_IN="7d"
PORT=4000
```

> 将其中的"你的密码"替换为实际 MySQL root 密码。

- [ ] **Step 4: 生成 Prisma Client + 执行迁移**

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
cd ..
```

验证: `npx prisma db seed`（先跳过，无 seed 文件）。检查 MySQL 中 `pangmiao_dev` 库应出现 `User` 表。

- [ ] **Step 5: 创建 Prisma 模块**

创建 `server/src/prisma/prisma.service.ts`：

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

创建 `server/src/prisma/prisma.module.ts`：

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 6: 创建 app.module.ts 和 main.ts**

创建 `server/src/app.module.ts`：

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
})
export class AppModule {}
```

创建 `server/src/main.ts`：

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
```

- [ ] **Step 7: 验证 server 启动**

```bash
pnpm --filter server dev
```

应输出: `Server running on http://localhost:4000`

- [ ] **Step 8: 提交**

```bash
git add server/
git commit -m "feat: NestJS server 脚手架 + Prisma + User 表"
```

---

### Task 4: Auth 模块（注册 + 登录）

- [ ] **Step 1: 创建 DTO**

创建 `server/src/auth/dto/register.dto.ts`：

```typescript
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
```

创建 `server/src/auth/dto/login.dto.ts`：

```typescript
import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
```

- [ ] **Step 2: 创建 JWT 策略和守卫**

创建 `server/src/auth/jwt.strategy.ts`：

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret',
    });
  }

  async validate(payload: { sub: number; username: string; role: string }) {
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
```

创建 `server/src/auth/jwt-auth.guard.ts`：

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 3: 创建 AuthService**

创建 `server/src/auth/auth.service.ts`：

```typescript
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { username: dto.username, password: hashed },
    });

    return this.buildToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return this.buildToken(user);
  }

  private buildToken(user: { id: number; username: string; role: string }) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: (user as any).createdAt,
      },
    };
  }
}
```

- [ ] **Step 4: 创建 AuthController**

创建 `server/src/auth/auth.controller.ts`：

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

- [ ] **Step 5: 创建 AuthModule**

创建 `server/src/auth/auth.module.ts`：

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 6: 创建 UsersModule**

创建 `server/src/users/users.service.ts`：

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, role: true, createdAt: true },
    });
  }
}
```

创建 `server/src/users/users.controller.ts`：

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }
}
```

创建 `server/src/users/users.module.ts`：

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 7: 验证 auth API**

用 curl 测试（先确保 server 在跑）：

```bash
# 注册
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 应返回 { "accessToken": "...", "user": { "id": 1, "username": "test", ... } }

# 登录
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 获取当前用户
curl http://localhost:4000/api/users/me \
  -H "Authorization: Bearer <你的token>"
```

- [ ] **Step 8: 提交**

```bash
git add server/src/auth/ server/src/users/ server/src/app.module.ts
git commit -m "feat: 注册/登录 API + JWT 认证"
```

---

### Task 5: web/ 前端迁移 + API 封装

- [ ] **Step 1: 更新 web/package.json**

修改 `web/package.json`（Name + scripts）：

```json
{
  "name": "@pangmiao/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.60.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: 迁移 next.config.ts**

删除 `web/next.config.js`，创建 `web/next.config.ts`：

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
```

> 使用 rewrites 代理 API 请求到 NestJS 后端，前端 fetch `/api/*` 不需要写完整 URL。

- [ ] **Step 3: 创建 API 客户端**

创建 `web/src/lib/api.ts`：

```typescript
const API_BASE = '/api';

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.message || `Request failed: ${res.status}`);
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),

  post: <T = any>(path: string, body?: any) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
};
```

- [ ] **Step 4: 创建 useAuth hook**

创建 `web/src/hooks/useAuth.ts`：

```typescript
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<User>('/users/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const data = await api.post<{ accessToken: string; user: User }>('/auth/login', {
      username,
      password,
    });
    localStorage.setItem('token', data.accessToken);
    document.cookie = `token=${data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    setUser(data.user);
  };

  const register = async (username: string, password: string) => {
    await api.post('/auth/register', { username, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; max-age=0';
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 5: 创建 Next.js middleware**

创建 `web/src/middleware.ts`：

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // 公开页面不需要认证
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 其他页面需要认证
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 6: 安装依赖**

```bash
pnpm install
```

- [ ] **Step 7: 提交**

```bash
git add web/
git commit -m "feat: web 端 API 客户端 + useAuth hook + middleware 守卫"
```

---

### Task 6: web/ 登录页 + 注册页

- [ ] **Step 1: 重建 app 目录结构**

移动现有文件以适应 auth 分组：

```bash
# 保底文件
cd web/src/app

# 备份现有 layout 和 page（先不动，后面用）
cp layout.tsx ../../_layout_backup.tsx
cp page.tsx ../../_page_backup.tsx
cp globals.css globals.css  # 保持不动

# 清理后重建
rm -rf (auth) login register
```

实际上我们用更简单的方式 —— 保留现有文件，新建登录/注册页，然后调整。

- [ ] **Step 2: 创建全局 layout（含 AuthProvider）**

修改 `web/src/app/layout.tsx`：

```tsx
import type { Metadata } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import './globals.css';

export const metadata: Metadata = {
  title: '胖喵推荐 · 发现美食旅行乐趣',
  description: '胖喵推荐 - 吃喝玩乐推荐平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 创建登录页**

创建 `web/src/app/login/page.tsx`：

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('请填写所有字段'); return; }
    setLoading(true);
    try {
      await login(username, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🐱 胖喵推荐</h1>
        <p style={styles.subtitle}>登录后即可浏览推荐内容</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
        <p style={styles.footer}>
          还没有账号？<Link href="/register">注册</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(145deg, #fdfaf4, #f7efe0)',
    fontFamily: "'Source Sans 3', sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '48px 40px',
    width: 400,
    maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(45,26,14,.12)',
    textAlign: 'center' as const,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 32,
    color: '#2d1a0e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#b8a088',
    marginBottom: 32,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  input: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #e5d5c0',
    fontSize: 15,
    outline: 'none',
    fontFamily: "'Source Sans 3', sans-serif",
  },
  btn: {
    marginTop: 8,
    padding: '12px',
    border: 'none',
    borderRadius: 12,
    background: '#c06840',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Source Sans 3', sans-serif",
  },
  error: {
    color: '#c0392b',
    fontSize: 13,
    margin: 0,
  },
  footer: {
    marginTop: 24,
    fontSize: 13,
    color: '#b8a088',
  },
};
```

- [ ] **Step 4: 创建注册页**

创建 `web/src/app/register/page.tsx`：

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('请填写所有字段'); return; }
    if (password.length < 6) { setError('密码至少6位'); return; }
    setLoading(true);
    try {
      await register(username, password);
      router.push('/login?registered=1');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🐱 创建账号</h1>
        <p style={styles.subtitle}>加入胖喵，发现吃喝玩乐好去处</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="密码（至少6位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? '注册中…' : '注册'}
          </button>
        </form>
        <p style={styles.footer}>
          已有账号？<Link href="/login">登录</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(145deg, #fdfaf4, #f7efe0)',
    fontFamily: "'Source Sans 3', sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '48px 40px',
    width: 400,
    maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(45,26,14,.12)',
    textAlign: 'center' as const,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 32,
    color: '#2d1a0e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#b8a088',
    marginBottom: 32,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  input: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #e5d5c0',
    fontSize: 15,
    outline: 'none',
    fontFamily: "'Source Sans 3', sans-serif",
  },
  btn: {
    marginTop: 8,
    padding: '12px',
    border: 'none',
    borderRadius: 12,
    background: '#7d9a70',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Source Sans 3', sans-serif",
  },
  error: {
    color: '#c0392b',
    fontSize: 13,
    margin: 0,
  },
  footer: {
    marginTop: 24,
    fontSize: 13,
    color: '#b8a088',
  },
};
```

- [ ] **Step 5: 验证**

启动 server 和 web：

```bash
# 终端1
pnpm --filter server dev

# 终端2
pnpm --filter web dev
```

浏览器打开 `http://localhost:3000`：
- 未登录 → 自动跳转到 `/login`
- 点击"还没有账号？注册" → `/register`
- 注册新用户 → 跳转登录
- 登录 → 跳转首页（当前只有登录后看到的空页面 / 旧内容）

- [ ] **Step 6: 提交**

```bash
git add web/src/app/layout.tsx web/src/app/login/ web/src/app/register/
git commit -m "feat: 登录页 + 注册页"
```

---

### Task 7: 首页复用现有组件

- [ ] **Step 1: 调整首页逻辑**

修改 `web/src/app/page.tsx`，接入认证状态：

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LeftPanel } from '@/components/LeftPanel';
import { RightPanel } from '@/components/RightPanel';
import { ChatFloat } from '@/components/ChatFloat';

export default function Home() {
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
        <p style={{ color: '#b8a088', fontSize: 16 }}>加载中…</p>
      </div>
    );
  }

  if (!user) return null;

  return <HomeContent />;
}

function HomeContent() {
  const [activeTab, setActiveTab] = useState<'food' | 'travel' | 'fun'>('food');

  return (
    <div className="app">
      <LeftPanel activeTab={activeTab} onTabChange={setActiveTab} />
      <RightPanel activeTab={activeTab} />
      <ChatFloat />
    </div>
  );
}
```

- [ ] **Step 2: 确保组件导入路径正确**

确认 `web/tsconfig.json` 中的 `@/*` 路径映射指向 `./src/*`（移动时已保留）。

- [ ] **Step 3: 验证首页可用**

浏览器：登录后应看到原有胖喵首页（左侧面板 + 推荐卡片 + AI聊天），样式不变。

- [ ] **Step 4: 提交**

```bash
git add web/src/app/page.tsx
git commit -m "feat: 首页接入认证，登录后可见"
```

---

### Task 8: admin/ 管理后台骨架

- [ ] **Step 1: 创建 admin/package.json**

```json
{
  "name": "@pangmiao/admin",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: 创建 admin/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", "next-env.d.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 创建 admin/next.config.ts**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 4: 创建 admin/src/lib/api.ts**（同 web/ 版本）

```typescript
const API_BASE = '/api';

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.message || `Request failed: ${res.status}`);
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
};
```

- [ ] **Step 5: 创建 admin/src/hooks/useAuth.ts**（同 web/ 版本）

```typescript
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  login: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get<User>('/users/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const data = await api.post<{ accessToken: string; user: User }>('/auth/login', { username, password });
    localStorage.setItem('token', data.accessToken);
    document.cookie = `token=${data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; max-age=0';
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 6: 创建 admin/src/middleware.ts**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 7: 创建 admin 页面文件**

创建 `admin/src/app/globals.css`：

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary: #c06840;
  --bg: #f9f5ed;
  --surface: #fff;
  --text: #2d1a0e;
  --muted: #b8a088;
  --border: #e5d5c0;
  --radius: 12px;
}

body {
  font-family: 'Source Sans 3', -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}
```

创建 `admin/src/app/layout.tsx`：

```tsx
import type { Metadata } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import './globals.css';

export const metadata: Metadata = { title: '胖喵管理后台', description: '内容与用户管理' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
```

创建 `admin/src/app/page.tsx`（首页 → 重定向逻辑）：

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.push(user ? '/dashboard' : '/login');
    }
  }, [user, loading, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>加载中…</p>
    </div>
  );
}
```

创建 `admin/src/app/login/page.tsx`：

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('请填写所有字段'); return; }
    setLoading(true);
    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚙️ 管理后台</h1>
        <p style={styles.subtitle}>管理员登录</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} placeholder="用户名" value={username}
            onChange={(e) => setUsername(e.target.value)} />
          <input style={styles.input} type="password" placeholder="密码" value={password}
            onChange={(e) => setPassword(e.target.value)} />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#2d1a0e', fontFamily: "'Source Sans 3', sans-serif" },
  card: { background: '#fff', borderRadius: 24, padding: '48px 40px', width: 400,
    maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,.3)', textAlign: 'center' as const },
  title: { fontSize: 28, color: '#2d1a0e', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#b8a088', marginBottom: 32 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { padding: '12px 16px', borderRadius: 12, border: '1px solid #e5d5c0',
    fontSize: 15, outline: 'none', fontFamily: "'Source Sans 3', sans-serif" },
  btn: { marginTop: 8, padding: '12px', border: 'none', borderRadius: 12,
    background: '#2d1a0e', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Source Sans 3', sans-serif" },
  error: { color: '#c0392b', fontSize: 13, margin: 0 },
};
```

创建 `admin/src/app/(admin)/layout.tsx`：

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) return <div style={{ padding: 40, color: '#b8a088' }}>加载中…</div>;
  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>🐱 胖喵后台</h2>
        <nav style={styles.nav}>
          <a href="/dashboard" style={styles.navItem}>📊 仪表盘</a>
          <a href="/posts" style={styles.navItem}>📝 内容审核</a>
          <a href="/users" style={styles.navItem}>👥 用户管理</a>
        </nav>
        <button onClick={() => { useAuth().logout(); router.push('/login'); }} style={styles.logoutBtn}>
          退出登录
        </button>
      </aside>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: { width: 240, background: '#2d1a0e', color: '#fff', display: 'flex',
    flexDirection: 'column', padding: '24px 0', flexShrink: 0 },
  logo: { padding: '0 20px', marginBottom: 32, fontSize: 20, fontFamily: "'Playfair Display', serif" },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px', flex: 1 },
  navItem: { padding: '10px 16px', borderRadius: 10, color: '#e5d5c0',
    textDecoration: 'none', fontSize: 14 },
  main: { flex: 1, padding: '32px 40px', overflowY: 'auto' },
  logoutBtn: { margin: '12px', padding: '8px 16px', borderRadius: 8,
    background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13,
    fontFamily: "'Source Sans 3', sans-serif" },
};
```

创建 `admin/src/app/(admin)/page.tsx`：

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>👋 欢迎，{user?.username}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 32 }}>📝</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>0</div>
          <div style={{ color: '#b8a088', fontSize: 13 }}>待审核投稿</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 32 }}>✅</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>0</div>
          <div style={{ color: '#b8a088', fontSize: 13 }}>已发布内容</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 32 }}>👥</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>0</div>
          <div style={{ color: '#b8a088', fontSize: 13 }}>注册用户</div>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #e5d5c0',
  boxShadow: '0 2px 8px rgba(45,26,14,.04)',
};
```

- [ ] **Step 8: 安装依赖并验证**

```bash
pnpm install
pnpm --filter admin dev  # 启动在 3001 端口
```

浏览器打开 `http://localhost:3001` → 应跳转到 `/login` → 用之前注册的用户登录 → 看到仪表盘（计数器均为0）。

- [ ] **Step 9: 提交**

```bash
git add admin/
git commit -m "feat: admin 管理后台骨架（登录 + 仪表盘）"
```

---

### Task 9: 集成验证 + 收尾

- [ ] **Step 1: 三端联调**

```bash
# 同时启动
pnpm --filter server dev    # :4000
pnpm --filter web dev       # :3000
pnpm --filter admin dev     # :3001
```

验证流程：
1. 浏览器无痕窗口 → `localhost:3000` → 跳转登录页 ✓
2. 注册新用户 → 成功 → 跳转登录 ✓
3. 登录 → 首页展示推荐卡片 ✓
4. AI 聊天功能正常 ✓
5. `localhost:3001` → 管理员登录 → 仪表盘 ✓
6. 直接访问 `localhost:3000/register` 不被拦截 ✓

- [ ] **Step 2: 创建 .env.example**

在根目录创建 `.env.example`：

```
# Server (server/.env)
DATABASE_URL="mysql://root:密码@localhost:3306/pangmiao_dev"
JWT_SECRET="生成一个随机字符串"
JWT_EXPIRES_IN="7d"
PORT=4000

# 旧 DeepSeek key（web/ 下的 .env.local 中保留）
DEEPSEEK_API_KEY=your-api-key-here
```

- [ ] **Step 3: 提交完整项目**

```bash
git add .
git commit -m "chore: 集成收尾，三端联调通过"
```

---

## 自审检查清单

- [ ] Spec 覆盖：User 注册/登录 ✓ | 首页展示 ✓ | AI 聊天保留 ✓ | admin 骨架 ✓ | JWT 认证 ✓
- [ ] 通读搜索无 "TBD", "TODO", "implement later"
- [ ] 类型一致性：LoginDto/RegisterDto/UserInfo 在 shared、server、web 间一致
- [ ] Token 双重存储（localStorage + cookie）：localStorage 用于 API 请求头注入，cookie 用于 Next.js middleware 路由守卫读取
